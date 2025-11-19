import Reservation from "../models/reservation";
import ConfigModel from '../models/config';
import {ObjectId} from 'mongodb';
import { sendMail } from './mail';
import { ReservationEmailParams, buildReservationRequestEmail } from './emailTemplate';

export function computeNight(dateStart: Date, dateEnd: Date){
    const msPerDay = 1000 * 60 * 60 * 24;
    const utcA = Date.UTC(dateStart.getFullYear(), dateStart.getMonth(), dateStart.getDate());
    const utcB = Date.UTC(dateEnd.getFullYear(), dateEnd.getMonth(), dateEnd.getDate());

    return Math.round((utcB - utcA) / msPerDay);
}

export function computeFees(totalPrice: number){
  return totalPrice;
  //return ((totalPrice * 1.25/100) + 0.25);
}

export async function computeNightPriceTotal(dateStart: Date, dateEnd: Date){
    const config = await ConfigModel.findOne().sort({ createdAt: -1 });
    return computeNight(dateStart, dateEnd) * config!.price;
}

export async function computeTotalPrice(dateStart: Date, dateEnd: Date){
  const nightPrice = await computeNightPriceTotal(dateStart, dateEnd);

  return nightPrice+computeFees(nightPrice);
}

export async function getReservations(fromNow: boolean = true){
    const filter = fromNow ? { endDate: { $gt: new Date() }, archived: false} : {};
    const reservationSchemaList = await Reservation.find(filter).lean();

    return reservationSchemaList;
}

export async function getReservationsAsArray(fromNow: boolean = true){
    const reservationSchemaList = await getReservations(fromNow);
    let reservationArray: [string, string, ObjectId, boolean | null | undefined, string | null | undefined][] = [];  
    if(reservationSchemaList) reservationArray= reservationSchemaList.map(r => [r.startDate.toISOString(), r.endDate.toISOString(), r._id, r.archived, r.type]);

    return reservationArray;
}

export async function checkReservationConflict(dateStart: Date, dateEnd: Date){
   const reservationSchemaList = await Reservation.find({
    $or: [
      {
        startDate: { $lte: dateStart },
        endDate:   { $gte: dateStart },
        archived: false
      },
      {
        startDate: { $lte: dateEnd },
        endDate:   { $gte: dateEnd },
        archived: false
      }
    ]
  }).lean();

  return reservationSchemaList.length > 0;
}

export async function proceedReservation(startDate: Date, endDate: Date, guests: number, lastname: string, firstname: string, email: string, tel: string, shouldSendEmail: boolean = true, totalPrice:number = -1, type: string = "SITE"){
  if(totalPrice < 0) totalPrice = await computeTotalPrice(startDate, endDate);

  const reservationSchemaList = await Reservation.find({
    startDate: { $gt: startDate, $lt: endDate},
    endDate: { $gt: startDate, $lt: endDate}
  }).lean();

  if(await checkReservationConflict(startDate, endDate)){
    const reservationArray = await getReservationsAsArray();

    return { 
      ok: false, 
      message:"Une autre personne a réserver ce créneau entre temps. Nous vous invitons à sélectionner d'autres dates.",
      reservations: reservationArray
    };
  }else {
    await Reservation.create({ startDate: startDate, endDate: endDate, guests: guests, totalPrice: totalPrice, lastname: lastname, firstname: firstname, email: email, tel: tel, type: type });
    const reservationArray = await getReservationsAsArray();
    const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"];
    const startDateFR = days[startDate.getDay()] + " " + startDate.getDate() + "/" + (startDate.getMonth()+1) + "/" +startDate.getFullYear();
    const endDateFR = days[endDate.getDay()] + " " + endDate.getDate() + "/" + (endDate.getMonth()+1) + "/" +endDate.getFullYear();
    const nightNumber = computeNight(startDate, endDate);

    const emailHtml = buildReservationRequestEmail({
      companyLogoUrl: "https://dev.front.vinais.ovh/static/closjarjart_min.png",
      startDate: startDateFR, endDate: endDateFR, firstName: firstname, lastName: lastname, phoneNumber: tel, email: email, 
      guests:guests.toString(), nights: nightNumber.toString(), price:totalPrice.toString()
    });
    const emailSubject = "Location du "+ startDateFR + " au " + endDateFR;

    if(shouldSendEmail) sendMail(process.env.SMTP_TO!, "maxime.vinais@gmail.com", emailSubject, emailHtml);

    return { 
      ok: true, 
      message:"Votre demande de réservation a été envoyé. Vous serez contacté dans moins de 24h par l'hôte pour valider la réservation.",
      reservations: reservationArray
    };
  }
}