import Reservation from "../models/reservation";
import ConfigModel from '../models/config';
import {ObjectId} from 'mongodb';

export function computeNight(dateStart: Date, dateEnd: Date){
    const msPerDay = 1000 * 60 * 60 * 24;
    const utcA = Date.UTC(dateStart.getFullYear(), dateStart.getMonth(), dateStart.getDate());
    const utcB = Date.UTC(dateEnd.getFullYear(), dateEnd.getMonth(), dateEnd.getDate());

    return Math.round((utcB - utcA) / msPerDay);
}

export async function computeTotalPrice(dateStart: Date, dateEnd: Date){
    const config = await ConfigModel.findOne().sort({ createdAt: -1 });
    return computeNight(dateStart, dateEnd) * config!.price;
}

export async function getReservations(fromNow: boolean = true){
    const filter = fromNow ? { endDate: { $gt: new Date() }} : {};
    const reservationSchemaList = await Reservation.find(filter).lean();

    return reservationSchemaList;
}

export async function getReservationsAsArray(fromNow: boolean = true){
    const reservationSchemaList = await getReservations(fromNow);
    let reservationArray: [string, string, ObjectId, boolean | null | undefined, string | null | undefined][] = [];  
    if(reservationSchemaList) reservationArray= reservationSchemaList.map(r => [r.startDate.toISOString(), r.endDate.toISOString(), r._id, r.isConfirmed, r.type]);

    return reservationArray;
}

export async function checkReservationConflict(dateStart: Date, dateEnd: Date){
   const reservationSchemaList = await Reservation.find({
    $or: [
      {
        startDate: { $lte: dateStart },
        endDate:   { $gte: dateStart }
      },
      {
        startDate: { $lte: dateEnd },
        endDate:   { $gte: dateEnd }
      }
    ]
  }).lean();

  return reservationSchemaList.length > 0;
}