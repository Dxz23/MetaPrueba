// src/services/messageHandler.js
import path from 'path';
import fs from 'fs';
import whatsappService from './whatsappService.js';
import appendToSheet from './googleSheetsService.js';
import { uploadFileToDrive } from './googleDriveService.js';
import { downloadMediaFile } from './whatsappMediaService.js';

// =========================================================
// FUNCIONES DE UTILIDAD PARA NORMALIZAR NÚMEROS
// =========================================================
function normalizeMexicanPhone(phoneNumber) {
  let digits = phoneNumber.replace(/\D/g, '');
  if (digits.startsWith('521')) {
    digits = '52' + digits.slice(3);
  }
  return digits;
}
function normalizePhone(phoneNumber) {
  return normalizeMexicanPhone(phoneNumber);
}

// =========================================================
// CONSTANTES Y CONFIGURACIÓN (LISTA COMPLETA DE CÓDIGOS POSTALES)
// =========================================================
const coverageZipCodes = [
  "22183", "22750", "22755", "22760", "22766", "22785", "22790", "22793", "22794", "22796",
  "22800", "22810", "22812", "22813", "22814", "22815", "22818", "22819", "22820", "22822",
  "22823", "22825", "22830", "22839", "22840", "22842", "22847", "22850", "22852", "22855",
  "22860", "22870", "22872", "22873", "22879", "22880", "22887", "22889", "22890", "22895",
  "22898", "22908", "22710", "22000", "22616", "22665", "22700", "22703", "22704", "22705",
  "22706", "22707", "22709", "22710", "22712", "22713", "22714", "22715", "22716", "22717",
  "22740", "22790", "22793", "25504", "21400", "21410", "21420", "21430", "21440", "21446",
  "21447", "21448", "21449", "21450", "21452", "21453", "21460", "21462", "21470", "21471",
  "21472", "21478", "21480", "21485", "21490", "21496", "21507", "21530", "24180", "46400",
  "21010", "21060", "22", "22000", "22010", "22014", "22015", "22020", "22024", "22025",
  "22030", "22034", "22035", "22040", "22044", "22045", "22046", "22050", "22054", "22055",
  "22056", "22061", "22100", "22104", "22105", "22106", "22110", "22114", "22115", "22116",
  "22117", "22120", "22123", "22124", "22125", "22126", "22127", "22160", "22163", "22164",
  "22165", "22170", "22180", "22183", "22185", "22186", "22190", "22194", "22195", "22196",
  "22200", "22203", "22204", "22205", "22206", "22207", "22210", "22214", "22215", "22216",
  "22217", "22220", "22223", "22224", "22225", "22226", "22230", "22234", "22235", "22236",
  "22237", "22244", "22245", "22246", "22250", "22253", "22254", "22255", "22260", "22263",
  "22264", "22330", "22333", "22334", "22400", "22404", "22405", "22406", "22410", "22414",
  "22415", "22416", "22420", "22425", "22426", "22427", "22430", "22434", "22435", "22436",
  "22440", "22450", "22454", "22455", "22456", "22457", "22460", "22464", "22465", "22470",
  "22473", "22474", "22476", "22500", "22504", "22505", "22506", "22510", "22515", "22517",
  "22520", "22523", "22524", "22525", "22526", "22530", "22534", "22535", "22536", "22544",
  "22545", "22550", "22555", "22557", "22564", "22600", "22604", "22605", "22606", "22607",
  "22610", "22614", "22615", "22616", "22620", "22624", "22625", "22626", "22630", "22634",
  "22635", "22636", "22637", "22640", "22643", "22644", "22645", "22646", "22647", "22650",
  "22654", "22660", "22663", "22664", "22665", "22666", "22667", "22680", "22705", "38242",
  "45475", "21000", "21010", "21030", "21038", "21040", "21050", "21060", "21062", "21070",
  "21079", "21090", "21100", "21101", "21110", "22120", "22130", "22135", "22137", "22138",
  "22139", "22140", "22147", "21150", "21160", "21165", "21170", "21179", "21180", "21185",
  "21188", "22190", "21200", "21210", "21216", "21218", "21219", "21220", "21225", "21229",
  "21230", "21240", "21250", "21254", "21257", "21258", "21259", "21260", "21270", "21280",
  "21290", "21297", "21298", "21299", "21300", "21307", "21309", "21310", "21323", "21324",
  "21325", "21326", "21327", "21330", "21337", "21339", "21340", "21350", "21353", "21354",
  "21355", "21356", "21360", "21370", "21376", "21378", "21379", "21380", "21384", "21385",
  "21386", "21387", "21389", "21390", "21394", "21395", "21396", "21397", "21398", "21399",
  "21600", "21602", "21620", "21628", "21700", "21705", "21720", "21739", "21837", "22785"
];

function formatPackageName(packageId) {
  return packageId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function getStepPrompt(step) {
  const prompts = {
    cobertura:
      "📍 Verificación de Cobertura 🏡📡\n\n✍️ Escribe tu código postal para confirmar la disponibilidad del servicio en tu zona.",
    nombre:
      "1️⃣ Nombre completo 📝\n✍️ Por favor, escribe tu nombre tal como aparece en tu identificación.",
    correo:
      "2️⃣ Correo electrónico 📧\n✉️ Ahora necesitamos tu correo electrónico para enviarte la confirmación de tu servicio.",
    celulares:
      "3️⃣ Dos números celulares 📱\n📌 Indícanos dos números de contacto:\n✅ Número del titular (Para contacto principal)\n✅ Número de emergencia (Si no logramos comunicarnos por el primero)\n\n*Cada número debe tener 10 dígitos.*",
    identificacion_frontal:
      "4️⃣ Identificación oficial (INE) 🆔\n🔒 Envía aquí la foto de la parte **frontal** de tu INE.",
    identificacion_trasera:
      "Ahora envía la foto de la parte **trasera** de tu INE.",
    domicilio:
      "5️⃣ Comprobante de domicilio 🏠\n📄 Envía aquí la foto de tu comprobante de domicilio (recibo, luz, agua, gas, teléfono o estado de cuenta)."
  };
  return prompts[step] || "Por favor, continúa con el proceso.";
}

function getStepHeader(step) {
  const headers = {
    cobertura: { type: "image", image: { link: "https://storage.googleapis.com/imagenes-izzi-2025/MexicaliCentroCP.png" } },
    nombre: { type: "image", image: { link: "https://storage.googleapis.com/imagenes-izzi-2025/maxresdefault%20(1).jpg" } },
    correo: { type: "image", image: { link: "https://storage.googleapis.com/imagenes-izzi-2025/gmail.png" } },
    celulares: { type: "image", image: { link: "https://storage.googleapis.com/imagenes-izzi-2025/istockphoto-1347843229-612x612.jpg" } },
    identificacion_frontal: { type: "image", image: { link: "https://storage.googleapis.com/imagenes-izzi-2025/ine.jpg" } },
    identificacion_trasera: { type: "image", image: { link: "https://storage.googleapis.com/imagenes-izzi-2025/ine.jpg" } },
    domicilio: { type: "image", image: { link: "https://storage.googleapis.com/imagenes-izzi-2025/comprobante.jpg" } }
  };
  return headers[step] || null;
}

// =========================================================
// CLASE MessageHandler
// =========================================================
class MessageHandler {
  constructor() {
    this.contractState = {};
  }

  // Registro de IDs ya procesados para evitar duplicados
  markMessageAsProcessed(to, messageId) {
    if (!this.contractState[to]) {
      this.contractState[to] = {};
    }
    if (!this.contractState[to].processedIds) {
      this.contractState[to].processedIds = new Set();
    }
    this.contractState[to].processedIds.add(messageId);
  }
  isMessageProcessed(to, messageId) {
    return (
      this.contractState[to] &&
      this.contractState[to].processedIds &&
      this.contractState[to].processedIds.has(messageId)
    );
  }

  // Funciones básicas de mensajería
  isGreeting(message) {
    const greetings = ["hola", "hello", "buenas tardes"];
    return greetings.some(greet => message.toLowerCase().includes(greet));
  }

  async sendWelcomeMessage(to, messageId, senderInfo) {
    try {
      const name = senderInfo.profile?.name || senderInfo.wa_id || "";
      const imageUrl = "https://raw.githubusercontent.com/Dxz23/imagenes-publicas/main/Logotipo_izzi_negativo.png";
      console.log("Enviando mensaje de bienvenida a:", to);
      await whatsappService.sendWelcomeInteractiveMessage(to, name, imageUrl);
    } catch (error) {
      console.error("Error en sendWelcomeMessage:", error);
    }
  }

  // Menú de bienvenida con dos botones: Ver paquetes y Asesor
  async sendWelcomeMenu(to) {
    try {
      const menuMessage = `🎉 ¡Bienvenido a IZZI! 📡🌎 La mejor conexión para tu hogar u oficina.

📢 ¡Promos por tiempo limitado! 🔥 Contrata ahora y aprovecha descuentos exclusivos.

🔍 Elige lo que necesitas:
📦 Ver paquetes – Descubre nuestras ofertas imperdibles 💰💡
💬 Hablar con un asesor – Obtén ayuda personalizada 🤝

⏳ ¡No te quedes sin conexión! Internet rápido, seguro y estable te espera. 🎯`;
      const buttons = [
        { type: "reply", reply: { id: "ver_paquetes", title: "Ver paquetes" } },
        { type: "reply", reply: { id: "asesor", title: "Asesor" } }
      ];
      const header = {
        type: "image",
        image: { link: "https://raw.githubusercontent.com/Dxz23/imagenes-publicas/main/Logotipo_izzi_negativo.png" }
      };
      console.log("Enviando menú de bienvenida a:", to);
      await whatsappService.sendWelcomeMenuMessage(to, menuMessage, buttons, header);
    } catch (error) {
      console.error("Error en sendWelcomeMenu:", error);
    }
  }

  async sendPackages(to) {
    try {
      const messageText = `🌟 ¡Conéctate con IZZI! 📡💡

📦 Elige el paquete perfecto para ti:

🔹 Triple Play – Internet + TV + Telefonía
🔹 Double Play – Internet + Telefonía
🔹 Single Play – Solo TV

💬 ¿Quieres más información o contratar ahora? Responde con la opción que prefieras.

✍️ Si necesitas más información escribe "asesor" para hablar con un experto.`;
      const buttons = [
        { type: "reply", reply: { id: "triple_play", title: "Triple Play" } },
        { type: "reply", reply: { id: "double_play", title: "Double Play" } },
        { type: "reply", reply: { id: "single_play", title: "Single Play" } }
      ];
      const header = {
        type: "image",
        image: { link: "https://raw.githubusercontent.com/Dxz23/imagenes-publicas/main/carrusel_01_desktop.png" }
      };
      console.log("Enviando mensaje de paquetes a:", to);
      await whatsappService.sendWelcomeMenuMessage(to, messageText, buttons, header);
      if (!this.contractState[to] || this.contractState[to].step === "cobertura") {
        this.schedulePackagesReminder(to);
      }
    } catch (error) {
      console.error("Error en sendPackages:", error);
    }
  }

  async sendSinglePlay(to) {
    const messageText = `📺 ¡Disfruta el mejor entretenimiento con izzi tv+! 🎬🔥

💰 Solo $299 al mes – ¡Sin importar tu compañía de internet!

📜 Contrato a 12 meses – Accede a 200 canales de TV desde cualquier dispositivo.

✨ Beneficios:
✔️ 200 canales de TV
✔️ Android TV
✔️ Hasta 1 extensión de TV (por $79 adicionales)
✔️ Acceso a izzi Go
✔️ ViX Premium GRATIS por 12 meses
✔️ Sky Sports + LaLiga EA Sports

✍️ Escribe "asesor" para atención personalizada.
  
Responde con "contratar" o "asesor".`;
    const buttons = [
      { type: "reply", reply: { id: "contratar", title: "Contratar" } },
      { type: "reply", reply: { id: "asesor", title: "Asesor" } }
    ];
    const header = {
      type: "image",
      image: { link: "https://storage.googleapis.com/imagenes-izzi-2025/Singleplay_1.png" }
    };
    await whatsappService.sendInteractiveButtons(to, messageText, buttons, header);
  }

  async sendDoublePlay(to) {
    const messageText = `🚀 ¡Disfruta el mejor paquete Double Play con IZZI! 📡📞

💰 Promoción exclusiva por 3 meses con el doble de megas y precios increíbles 🔥

📜 Contrato a 12 meses – Los primeros 3 meses con descuento y el doble de velocidad

✨ Elige la velocidad y beneficios que mejor se adapten a ti:
🔹 60 Megas por 3 Meses 💨 (Después 40 Megas)
💲 $349 MXN por 3 meses (Después $389 MXN fijo)
🔹 80 Megas por 3 Meses ⚡ (Después 60 Megas)
💲 $419 MXN por 3 meses (Después $510 MXN fijo)
🔹 100 Megas por 3 Meses 🚀 (Después 80 Megas)
💲 $439 MXN por 3 meses (Después $540 MXN fijo)
🔹 200 Megas por 3 Meses ⚡💨 (Después 150 Megas)
💲 $509 MXN por 3 meses (Después $610 MXN fijo)

📺 Incluye ViX Premium + HBO Max por 12 meses 🎥🍿

📢 ¡Aprovecha esta promo antes de que termine!
✍️ Escribe "asesor" para recibir atención personalizada. 💬✅

💡 ¿Cuál te interesa?`;
    const buttons = [
      { type: "reply", reply: { id: "double_40", title: "Double 40" } },
      { type: "reply", reply: { id: "double_60", title: "Double 60" } },
      { type: "reply", reply: { id: "double_80", title: "Double 80" } }
    ];
    const header = {
      type: "image",
      image: { link: "https://storage.googleapis.com/imagenes-izzi-2025/Double-Play_1.png" }
    };
    await whatsappService.sendInteractiveButtons(to, messageText, buttons, header);
  }

  async sendTriplePlay(to) {
    const messageText = `🚀 ¡Disfruta el mejor paquete Triple Play con IZZI! 📡🎬📞

💰 Promoción exclusiva por 6 meses con el doble de megas y precios increíbles 🔥

📜 Contrato a 12 meses – Los primeros 6 meses con descuento y el doble de velocidad

✨ Elige la velocidad y beneficios que mejor se adapten a ti:
🔹 60 Megas por 6 Meses 💨 (Después 40 Megas)
💲 $499 MXN por 6 meses (Después $539 MXN fijo)
🔹 80 Megas por 6 Meses ⚡ (Después 60 Megas)
💲 $569 MXN por 6 meses (Después $660 MXN fijo)
🔹 100 Megas por 6 Meses 🚀 (Después 80 Megas)
💲 $589 MXN por 6 meses (Después $690 MXN fijo)
🔹 200 Megas por 6 Meses ⚡💨 (Después 150 Megas)
💲 $659 MXN por 6 meses (Después $760 MXN fijo)

📺 Incluye 200 canales de TV + ViX Premium + LaLiga EA Sports + Sky Sports con Bundesliga 🎥⚽🏆

📢 ¡Aprovecha esta promo antes de que termine!
✍️ Escribe "asesor" para recibir atención personalizada. 💬✅

¿Cuál te interesa?`;
    const buttons = [
      { type: "reply", reply: { id: "triple_40", title: "Triple 40" } },
      { type: "reply", reply: { id: "triple_60", title: "Triple 60" } },
      { type: "reply", reply: { id: "triple_80", title: "Triple 80" } }
    ];
    const header = {
      type: "image",
      image: { link: "https://storage.googleapis.com/imagenes-izzi-2025/TriplePlayIzzi_1.png" }
    };
    await whatsappService.sendInteractiveButtons(to, messageText, buttons, header);
  }

  async sendAsesorContact(to) {
    await whatsappService.sendMessage("6611309881", `${to} llamó a asesor`);
    const advisors = [
      {
        first_name: "Monica",
        last_name: "",
        phone: "+526861716364",
        wa_id: "5216861716364",
        photo: "https://storage.googleapis.com/imagenes-izzi-2025/monica.png"
      },
      {
        first_name: "Lupita",
        last_name: "",
        phone: "+526625812173",
        wa_id: "5216625812173",
        photo: "https://storage.googleapis.com/imagenes-izzi-2025/lupita.png"
      },
      {
        first_name: "Ana",
        last_name: "SALAZAR",
        phone: "+526862729645",
        wa_id: "5216862729645",
        photo: "https://storage.googleapis.com/imagenes-izzi-2025/ana.png"
      },
      {
        first_name: "Berta",
        last_name: "",
        phone: "+526863486070",
        wa_id: "5216863486070",
        photo: "https://storage.googleapis.com/imagenes-izzi-2025/berta.png"
      }
    ];
    const randomIndex = Math.floor(Math.random() * advisors.length);
    const selectedAdvisor = advisors[randomIndex];
  
    await whatsappService.sendMediaMessage(to, "image", selectedAdvisor.photo, "");
    await new Promise(resolve => setTimeout(resolve, 1000));
  
    const contact = {
      name: {
        formatted_name: `Asesor ${selectedAdvisor.first_name} ${selectedAdvisor.last_name}`.trim(),
        first_name: selectedAdvisor.first_name,
        last_name: selectedAdvisor.last_name
      },
      phones: [
        { phone: selectedAdvisor.phone, wa_id: selectedAdvisor.wa_id, type: "WORK" }
      ]
    };
    await whatsappService.sendContactMessage(to, contact);
    await new Promise(resolve => setTimeout(resolve, 500));
  
    const menuMessage = `🤝 ¡Tu asesor está listo para atenderte! 💬

📢 Para iniciar la conversación, solo envíale un mensaje en WhatsApp.
📞 Hemos compartido su contacto contigo.

✨ ¿Cómo continuar?
1️⃣ Abre el chat con tu asesor.
2️⃣ Envía un "Hola" o consulta tu duda.
3️⃣ Recibirás asistencia personalizada de inmediato.

Mientras tanto, puedes explorar más opciones:
📦 Ver paquetes – Descubre nuestras ofertas.

✍️ Escribe "menu" si deseas volver al inicio.`;
    const buttons = [
      { type: "reply", reply: { id: "ver_paquetes", title: "Ver paquetes" } },
      { type: "reply", reply: { id: "asesor", title: "Asesor" } }
    ];
    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }

  async sendStepMessage(to, prompt, header = null) {
    try {
      const buttons = [
        { type: "reply", reply: { id: "asesor", title: "Asesor" } }
      ];
      await whatsappService.sendInteractiveButtons(to, prompt, buttons, header);
    } catch (error) {
      console.error("Error en sendStepMessage:", error);
    }
  }

  // ---------------------------
  // CONTROL DE RECORDATORIOS
  // ---------------------------
  schedulePackagesReminder(to) {
    try {
      if (this.contractState[to] && this.contractState[to].packagesReminder) {
        clearTimeout(this.contractState[to].packagesReminder);
        delete this.contractState[to].packagesReminder;
      }
      const messageText = `📢 ¡Hola! Notamos que aún no has elegido tu paquete IZZI y queremos asegurarnos de que no pierdas esta promoción.
  
Elige entre:
📡 Triple Play – Internet + TV + Telefonía
📞 Double Play – Internet + Telefonía
📺 Single Play – Solo TV
  
Si tienes dudas, escribe "asesor".`;
      const buttons = [
        { type: "reply", reply: { id: "triple_play", title: "Triple Play" } },
        { type: "reply", reply: { id: "double_play", title: "Double Play" } },
        { type: "reply", reply: { id: "single_play", title: "Single Play" } }
      ];
      const header = {
        type: "image",
        image: { link: "https://raw.githubusercontent.com/Dxz23/imagenes-publicas/main/izzi_logo_recordatorio.png" }
      };
  
      const sendReminder = async () => {
        console.log("Enviando recordatorio de paquetes a:", to);
        await whatsappService.sendWelcomeMenuMessage(to, messageText, buttons, header);
      };
  
      const reminder = setTimeout(sendReminder, 7200000);
      if (!this.contractState[to]) {
        this.contractState[to] = {};
      }
      this.contractState[to].packagesReminder = reminder;
    } catch (error) {
      console.error("Error en schedulePackagesReminder:", error);
    }
  }
  
  cancelPackagesReminder(to) {
    const state = this.contractState[to];
    if (state && state.packagesReminder) {
      clearTimeout(state.packagesReminder);
      delete state.packagesReminder;
    }
  }
  
  scheduleContractingReminders(to) {
    try {
      this.cancelContractingReminders(to);
      const state = this.contractState[to];
      if (!(state && state.package)) return;
      const messageText = `📢 ¡Hola de nuevo! Notamos que aún no hemos completado tu contratación de ${formatPackageName(state.package)}.
        
🔹 Tu solicitud sigue en proceso:
✅ Instalación rápida
✅ Planes flexibles
✅ Internet de alta velocidad
        
✨ Faltan unos detalles para activar tu servicio.`;
      const buttons = [
        { type: "reply", reply: { id: "continuar_proceso", title: "Continuar proceso" } },
        { type: "reply", reply: { id: "asesor", title: "Asesor" } }
      ];
      const header = {
        type: "image",
        image: { link: "https://raw.githubusercontent.com/Dxz23/imagenes-publicas/main/izzi_logo_recordatorio.png" }
      };
  
      const sendReminder = async () => {
        console.log("Enviando recordatorio de contratación a:", to);
        await whatsappService.sendInteractiveButtons(to, messageText, buttons, header);
      };
  
      const reminder = setTimeout(sendReminder, 7200000);
      state.reminders = { contracting: reminder };
    } catch (error) {
      console.error("Error en scheduleContractingReminders:", error);
    }
  }
  
  cancelContractingReminders(to) {
    const state = this.contractState[to];
    if (state && state.reminders && state.reminders.contracting) {
      clearTimeout(state.reminders.contracting);
      delete state.reminders.contracting;
    }
  }
  
  // ---------------------------
  // MANEJO DEL FLUJO DE MENÚ Y CONTRATACIÓN
  // ---------------------------
  async handleMenuOption(to, option) {
    const normalizedTo = normalizeMexicanPhone(to);
    this.cancelPackagesReminder(normalizedTo);
    this.cancelContractingReminders(normalizedTo);
  
    switch (option) {
      case "ver_paquetes": {
        await this.sendPackages(normalizedTo);
        break;
      }
      case "single_play": {
        this.contractState[normalizedTo] = { step: "single_details", package: "single_play" };
        await this.sendSinglePlay(normalizedTo);
        break;
      }
      case "double_play": {
        this.contractState[normalizedTo] = { step: "double_details", package: "double_play" };
        await this.sendDoublePlay(normalizedTo);
        break;
      }
      case "triple_play": {
        this.contractState[normalizedTo] = { step: "triple_details", package: "triple_play" };
        await this.sendTriplePlay(normalizedTo);
        break;
      }
      case "double_40":
      case "double_60":
      case "double_80":
      case "triple_40":
      case "triple_60":
      case "triple_80": {
        this.contractState[normalizedTo] = { step: "cobertura", package: option };
        this.scheduleContractingReminders(normalizedTo);
        await this.sendStepMessage(normalizedTo, getStepPrompt("cobertura"));
        break;
      }
      case "continuar_proceso": {
        this.cancelContractingReminders(normalizedTo);
        this.scheduleContractingReminders(normalizedTo);
        const state = this.contractState[normalizedTo];
        const prompt = getStepPrompt(state.step);
        await this.sendStepMessage(normalizedTo, prompt, getStepHeader(state.step));
        break;
      }
      case "asesor": {
        await this.sendAsesorContact(normalizedTo);
        break;
      }
      case "menu":
      case "menú": {
        this.cancelPackagesReminder(normalizedTo);
        delete this.contractState[normalizedTo];
        await this.sendWelcomeMenu(normalizedTo);
        break;
      }
      default:
        await this.sendWelcomeMenu(normalizedTo);
    }
  }
  
  async handleContractFlow(to, messageText, messageId) {
    if (this.isMessageProcessed(to, messageId)) return;
    this.markMessageAsProcessed(to, messageId);
  
    let lowerText = typeof messageText === "string" ? messageText.toLowerCase().trim() : "";
    const normalizedInput = lowerText.replace(/\s+/g, "_");
  
    if (["menu", "menú"].includes(lowerText)) {
      this.cancelContractingReminders(to);
      delete this.contractState[to];
      await this.sendWelcomeMenu(to);
      return;
    }
    if (lowerText === "asesor") {
      this.cancelContractingReminders(to);
      delete this.contractState[to];
      await this.sendAsesorContact(to);
      return;
    }
    if (lowerText === "continuar_proceso") {
      this.cancelContractingReminders(to);
      this.scheduleContractingReminders(to);
      const state = this.contractState[to] || {};
      const prompt = getStepPrompt(state.step || "cobertura");
      await this.sendStepMessage(to, prompt, getStepHeader(state.step));
      return;
    }
    if (!this.contractState[to]) {
      this.contractState[to] = { step: "cobertura" };
    }
    let state = this.contractState[to];
    if (
      (state.step === "single_details" ||
       state.step === "double_details" ||
       state.step === "triple_details") &&
      lowerText === "contratar"
    ) {
      state.step = "cobertura";
      this.scheduleContractingReminders(to);
      await this.sendStepMessage(to, getStepPrompt("cobertura"));
      return;
    }
    if (
      [
        "single_play",
        "double_play",
        "triple_play",
        "double_40",
        "double_60",
        "double_80",
        "triple_40",
        "triple_60",
        "triple_80"
      ].includes(normalizedInput)
    ) {
      await this.handleMenuOption(to, normalizedInput);
      return;
    }
    switch (state.step) {
      case "cobertura": {
        const zip = typeof messageText === "string" ? messageText.trim() : "";
        if (!zip) {
          await this.sendStepMessage(to, getStepPrompt("cobertura"), getStepHeader("cobertura"));
          return;
        }
        if (coverageZipCodes.includes(zip)) {
          this.cancelPackagesReminder(to);
          await whatsappService.sendMessage(
            to,
            "🎉 ¡Excelente! Tu zona cuenta con cobertura. Ahora necesitamos algunos datos para completar tu contratación.",
            messageId
          );
          state.step = "nombre";
          await this.sendStepMessage(to, getStepPrompt("nombre"), getStepHeader("nombre"));
        } else {
          await whatsappService.sendMessage(
            to,
            "😞 Lo sentimos, pero aún no contamos con cobertura en tu zona. Te avisaremos cuando izzi esté disponible.",
            messageId
          );
          delete this.contractState[to];
        }
        break;
      }
      case "nombre": {
        if (typeof messageText !== "string" || !messageText.trim()) {
          await this.sendStepMessage(to, getStepPrompt("nombre"), getStepHeader("nombre"));
          return;
        }
        state.nombre = messageText;
        state.step = "correo";
        await this.sendStepMessage(to, getStepPrompt("correo"), getStepHeader("correo"));
        break;
      }
      case "correo": {
        if (typeof messageText !== "string" || !messageText.trim() || !messageText.includes("@")) {
          await this.sendStepMessage(to, "✉️ Ingresa un correo electrónico válido.");
          return;
        }
        state.correo = messageText;
        state.step = "celulares";
        await this.sendStepMessage(to, getStepPrompt("celulares"), getStepHeader("celulares"));
        break;
      }
      case "celulares": {
        const nums = messageText.split(/[\s,]+/).filter(n => n && n.replace(/\D/g, "").length === 10);
        if (state.celulares) {
          const existing = state.celulares.split(" - ");
          const all = existing.concat(nums);
          if (all.length < 2) {
            await this.sendStepMessage(to, "📱 Ingresa el segundo número celular (10 dígitos).");
            return;
          }
          state.celulares = all.slice(0, 2).join(" - ");
          state.step = "identificacion_frontal";
          await this.sendStepMessage(to, getStepPrompt("identificacion_frontal"), getStepHeader("identificacion_frontal"));
        } else {
          if (nums.length === 2) {
            state.celulares = nums.join(" - ");
            state.step = "identificacion_frontal";
            await this.sendStepMessage(to, getStepPrompt("identificacion_frontal"), getStepHeader("identificacion_frontal"));
          } else if (nums.length === 1) {
            state.celulares = nums[0];
            await this.sendStepMessage(to, "📱 Ingresa el segundo número celular (10 dígitos).");
          } else {
            await this.sendStepMessage(to, "📱 Ingresa dos números celulares válidos (10 dígitos cada uno).");
            return;
          }
        }
        break;
      }
      case "identificacion_frontal": {
        // Se espera una imagen (o PDF) para la parte frontal de la INE
        if (
          typeof messageText !== "string" &&
          (messageText.type === "image" ||
           (messageText.type === "document" &&
            messageText.document.mime_type &&
            messageText.document.mime_type.includes("pdf")))
        ) {
          state.processingINEFront = true;
          const tempFilePath = path.join(process.cwd(), "temp", `ine_front_${to}.png`);
          const mediaId = messageText.image ? messageText.image.id : (messageText.document ? messageText.document.id : null);
          if (!mediaId) {
            await this.sendStepMessage(to, "❌ Error: No se encontró el ID de tu INE (parte frontal). Inténtalo nuevamente.");
            delete this.contractState[to];
            state.processingINEFront = false;
            return;
          }
          try {
            const fileBuffer = await downloadMediaFile(mediaId);
            fs.writeFileSync(tempFilePath, fileBuffer);
            console.log("INE frontal guardado en:", tempFilePath);
            const fileUrl = await uploadFileToDrive(tempFilePath, `ine_front_${to}.png`, "image/png");
            state.ine_front = fileUrl;
            // Cambia al siguiente paso: solicitar la parte trasera
            state.step = "identificacion_trasera";
            await this.sendStepMessage(to, getStepPrompt("identificacion_trasera"), getStepHeader("identificacion_trasera"));
          } catch (error) {
            console.error("Error al procesar la imagen frontal de la INE:", error);
            await this.sendStepMessage(to, "❌ Error al procesar tu INE. Inténtalo nuevamente.");
            delete this.contractState[to];
            state.processingINEFront = false;
            return;
          }
          state.processingINEFront = false;
        } else {
          await this.sendStepMessage(to, "❌ Por favor, envía una imagen o PDF de la parte frontal de tu INE para continuar.");
        }
        break;
      }
      case "identificacion_trasera": {
        // Se espera la imagen (o PDF) para la parte trasera de la INE
        if (
          typeof messageText !== "string" &&
          (messageText.type === "image" ||
           (messageText.type === "document" &&
            messageText.document.mime_type &&
            messageText.document.mime_type.includes("pdf")))
        ) {
          state.processingINEBack = true;
          const tempFilePath = path.join(process.cwd(), "temp", `ine_back_${to}.png`);
          const mediaId = messageText.image ? messageText.image.id : (messageText.document ? messageText.document.id : null);
          if (!mediaId) {
            await this.sendStepMessage(to, "❌ Error: No se encontró el ID de la parte trasera de tu INE. Inténtalo nuevamente.");
            delete this.contractState[to];
            state.processingINEBack = false;
            return;
          }
          try {
            const fileBuffer = await downloadMediaFile(mediaId);
            fs.writeFileSync(tempFilePath, fileBuffer);
            console.log("INE trasera guardada en:", tempFilePath);
            const fileUrl = await uploadFileToDrive(tempFilePath, `ine_back_${to}.png`, "image/png");
            state.ine_back = fileUrl;
            // Una vez recibidas ambas imágenes, se procede al comprobante de domicilio
            state.step = "domicilio";
            await this.sendStepMessage(to, getStepPrompt("domicilio"), getStepHeader("domicilio"));
          } catch (error) {
            console.error("Error al procesar la imagen trasera de la INE:", error);
            await this.sendStepMessage(to, "❌ Error al procesar tu INE. Inténtalo nuevamente.");
            delete this.contractState[to];
            state.processingINEBack = false;
            return;
          }
          state.processingINEBack = false;
        } else {
          await this.sendStepMessage(to, "❌ Por favor, envía una imagen o PDF de la parte trasera de tu INE para continuar.");
        }
        break;
      }
      case "domicilio": {
        if (
          typeof messageText !== "string" &&
          (messageText.type === "image" ||
           (messageText.type === "document" &&
            messageText.document.mime_type &&
            messageText.document.mime_type.includes("pdf")))
        ) {
          const tempFilePath = path.join(process.cwd(), "temp", `domicilio_${to}.png`);
          const mediaId = messageText.image ? messageText.image.id : (messageText.document ? messageText.document.id : null);
          if (!mediaId) {
            await this.sendStepMessage(to, "❌ Error: No se encontró el ID de tu comprobante. Inténtalo nuevamente.");
            delete this.contractState[to];
            return;
          }
          try {
            const fileBuffer = await downloadMediaFile(mediaId);
            fs.writeFileSync(tempFilePath, fileBuffer);
            console.log("Archivo comprobante guardado en:", tempFilePath);
            const fileUrl = await uploadFileToDrive(tempFilePath, `domicilio_${to}.png`, "image/png");
            state.domicilio = fileUrl;
            let tel1 = "";
            let tel2 = "";
            if (state.celulares) {
              const nums = state.celulares.split(" - ");
              tel1 = nums[0] || "";
              tel2 = nums[1] || "";
            }
            const userData = [
              tel1,
              tel2,
              state.nombre || "",
              state.correo || "",
              state.ine_front || "",
              state.ine_back || "",
              state.domicilio || ""
            ];
            await appendToSheet(userData);
            const finalMessageText = `🎉 ¡Gracias, ${state.nombre}! Hemos recibido tu información. Un asesor se pondrá en contacto contigo para los últimos pasos de la activación.`;
            const buttons = [
              { type: "reply", reply: { id: "asesor", title: "Asesor" } }
            ];
            const header = {
              type: "image",
              image: { link: "https://storage.googleapis.com/imagenes-izzi-2025/gracias.png" }
            };
            await whatsappService.sendInteractiveButtons(to, finalMessageText, buttons, header);
            await whatsappService.sendMessage("6611309881", `Venta registrada ${to}`);
            this.cancelContractingReminders(to);
            this.cancelPackagesReminder(to);
            delete this.contractState[to];
          } catch (error) {
            console.error("Error al descargar o guardar el comprobante:", error);
            await this.sendStepMessage(to, "❌ Error al procesar tu comprobante. Inténtalo nuevamente.");
            delete this.contractState[to];
            return;
          }
        } else {
          await this.sendStepMessage(to, getStepPrompt("domicilio"), getStepHeader("domicilio"));
        }
        break;
      }
      default: {
        await whatsappService.sendMessage(
          to,
          "⚠️ Opción no reconocida. Escribe *menu* para volver al menú principal.",
          messageId
        );
        delete this.contractState[to];
      }
    }
  }
  
  // ---------------------------
  // MANEJO DE MENSAJES CON ARCHIVOS (MEDIA)
  // ---------------------------
  async handleMediaMessage(message, senderInfo) {
    const fromNumber = normalizePhone(message.from);
    const state = this.contractState[fromNumber];
    if (!state) return;
    await this.handleContractFlow(fromNumber, message, message.id);
  }
  
  // ---------------------------
  // MANEJO DE MENSAJES ENTRANTES
  // ---------------------------
  async handleIncomingMessage(message, senderInfo) {
    const fromNumber = normalizePhone(message.from);
    if (message?.type === "text") {
      const incomingMessage = message.text.body.trim();
      console.log("Mensaje recibido:", incomingMessage);
      const normalizedOption = incomingMessage.toLowerCase().replace(/\s+/g, "_").trim();
      const packageOptions = [
        "triple_play",
        "double_play",
        "single_play",
        "triple_40",
        "triple_60",
        "triple_80",
        "double_40",
        "double_60",
        "double_80"
      ];
      if (packageOptions.includes(normalizedOption) && !this.contractState[fromNumber]) {
        await this.handleMenuOption(fromNumber, normalizedOption);
      } else if (this.contractState[fromNumber]) {
        await this.handleContractFlow(fromNumber, incomingMessage, message.id);
      } else if (this.isGreeting(incomingMessage)) {
        await this.sendWelcomeMessage(fromNumber, message.id, senderInfo);
      } else {
        await this.sendWelcomeMenu(fromNumber);
      }
      await whatsappService.markAsRead(message.id);
    } else if (message?.type === "interactive") {
      const option = message.interactive.button_reply.id.toLowerCase().trim();
      if (this.contractState[fromNumber]) {
        await this.handleContractFlow(fromNumber, option, message.id);
      } else {
        await this.handleMenuOption(fromNumber, option);
      }
      await whatsappService.markAsRead(message.id);
    } else {
      await this.handleMediaMessage(message, senderInfo);
      await whatsappService.markAsRead(message.id);
    }
  }
}

export default new MessageHandler();
