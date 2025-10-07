export interface ReservationEmailParams {
  companyLogoUrl: string;
  startDate: string;
  endDate: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  guests: string;
  nights: string;
  price: string;
}

export const buildReservationRequestEmail = ({
  companyLogoUrl,
  startDate,
  endDate,
  firstName,
  lastName,
  phoneNumber,
  email,
  guests,
  nights,
  price
}: ReservationEmailParams): string => `
<!doctype html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
  <meta charset="utf-8">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="x-ua-compatible" content="ie=edge">
  <title>New Rental Request</title>
  <style>
    @media only screen and (max-width:600px){
      .container{width:100% !important;}
      .px-24{padding-left:16px !important;padding-right:16px !important;}
      .py-24{padding-top:16px !important;padding-bottom:16px !important;}
      .text-center-sm{text-align:center !important;}
      .stack-sm{display:block !important;width:100% !important;}
    }
    @media (prefers-color-scheme: dark) {
      .bg-body { background:#0b0b0c !important; }
      .card     { background:#161618 !important; }
      .text     { color:#e9e9ea !important; }
      .muted    { color:#b8b8bb !important; }
      .divider  { border-color:#2b2b2e !important; }
    }
  </style>
</head>
<body class="bg-body" style="margin:0;padding:0;background:#f5f7fb;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    New rental request: ${firstName} ${lastName} from ${startDate} to ${endDate}.
  </div>

  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f5f7fb;">
    <tr>
      <td align="center" style="padding:24px;">
        <table role="presentation" class="container" cellpadding="0" cellspacing="0" width="600" style="width:600px;max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td align="center" style="background:#ffffff00;padding:24px;">
              <img src="${companyLogoUrl}" width="120" height="36" alt="logo_image"
                   style="display:block;border:0;outline:none;text-decoration:none;height:auto;max-width:100%;">
            </td>
          </tr>

          <tr>
            <td class="px-24 py-24" style="padding:24px;">
              <h1 class="text" style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:1.3;color:#0092b8;">
                Nouvelle demande de réservation
              </h1>
              <p class="muted" style="margin:8px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#64748b;">
                Vous trouverez ci-dessous le récapitulatif de la demande de réservation.
              </p>
            </td>
          </tr>

          <tr>
            <td class="px-24" style="padding:0 24px 24px 24px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="card" style="background:#ffffff;border:1px solid #e5e7eb;border-radius:10px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;padding:6px 0;"><strong style="color:#0092b8">Début:</strong></td><td align="right">${startDate}</td></tr>
                      <tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;padding:6px 0;border-top:1px solid #e5e7eb;"><strong style="color:#0092b8">Fin:</strong></td><td align="right">${endDate}</td></tr>
                      <tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;padding:6px 0;border-top:1px solid #e5e7eb;"><strong style="color:#0092b8">Nb nuits:</strong></td><td align="right">${nights}</td></tr>
                      <tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;padding:6px 0;border-top:1px solid #e5e7eb;"><strong style="color:#0092b8">Prénom:</strong></td><td align="right">${firstName}</td></tr>
                      <tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;padding:6px 0;border-top:1px solid #e5e7eb;"><strong style="color:#0092b8">Nom:</strong></td><td align="right">${lastName}</td></tr>
                      <tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;padding:6px 0;border-top:1px solid #e5e7eb;"><strong style="color:#0092b8">Téléphone:</strong></td><td align="right"><a href="tel:${phoneNumber}" style="color:#0f172a;text-decoration:none;">${phoneNumber}</a></td></tr>
                      <tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;padding:6px 0;border-top:1px solid #e5e7eb;"><strong style="color:#0092b8">Email:</strong></td><td align="right"><a href="mailto:${email}" style="color:#0f172a;text-decoration:none;">${email}</a></td></tr>
                      <tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;padding:6px 0;border-top:1px solid #e5e7eb;"><strong style="color:#0092b8">Nombre de personne:</strong></td><td align="right">${guests}</td></tr>
                      <tr><td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;padding:6px 0;border-top:1px solid #e5e7eb;"><strong style="color:#0092b8">Nombre de personne:</strong></td><td align="right"><strong style="color:#0092b8">${price}&euro;</strong></td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:16px 24px 28px 24px;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#94a3b8;">
                © Closjarjart — Tous droits réservé.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
