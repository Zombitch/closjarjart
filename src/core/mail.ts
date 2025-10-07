import nodemailer from "nodemailer";
import dotenv from 'dotenv';
import { htmlToText } from 'html-to-text';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PWD,
    },
});

export function sendMail(to: string, replyTo: string, subject: string, html: string){
    if(process.env.SEND_MAIL == "true"){
        return transporter.sendMail({
            from: '"CLOS JARJART" <maxime.vinais.fb@gmail.com>',
            replyTo: replyTo,
            to: to,
            subject: subject,
            text: htmlToText(html),
            html: html,
            attachments:[],
        }, (err) => {
            if(err){
                console.error("Erreur survenue pendant l'envoie de l'email : ", err)
            }
        });
    }
}