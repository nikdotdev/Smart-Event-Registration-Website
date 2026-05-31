import QRCode from "qrcode";

export const generateQRCode = async (data) => {
  try {
    const qrCode = await QRCode.toDataURL(data);
    return qrCode;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw error;
  }
};

export const generateQRCodeBuffer = async (data) => {
  try {
    const qrCode = await QRCode.toBuffer(data, {
      errorCorrectionLevel: "H",
      type: "image/png",
      width: 300,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    return qrCode;
  } catch (error) {
    console.error("Error generating QR code buffer:", error);
    throw error;
  }
};

export const verifyQRCode = (qrData, expectedData) => {
  return qrData === expectedData;
};
