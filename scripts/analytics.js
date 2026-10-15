(async () => {
  // URL do seu webhook do Discord
  const WEBHOOK_URL = atob('aHR0cHM6Ly9kaXNjb3JkYXBwLmNvbS9hcGkvd2ViaG9va3MvMTM4MjE0NDQ3ODgyMjc5MzIyOC84Nk91TGZGaDVQSWY2d1JIQU5Pamw4eVZ0aDlBZGRqX0owaERFZFV0c0NMQXVCY0FrNlZGR0o1X3hROEJYeUNreWY5cQ==');

  // Função para pegar IPs (IPv4 e IPv6) via API externa (ipify e ip6ify)
  async function getIPs() {
    const ips = { ipv4: null, ipv6: null };
    try {
      const res4 = await fetch('https://api64.ipify.org?format=json');
      const data4 = await res4.json();
      if (data4.ip.includes(':')) {
        ips.ipv6 = data4.ip;
      } else {
        ips.ipv4 = data4.ip;
      }
    } catch {}

    try {
      const res6 = await fetch('https://api64.ipv6ify.com/');
      if (res6.ok) {
        ips.ipv6 = await res6.text();
      }
    } catch {}

    return ips;
  }

  // Função para pegar localização por IP (fallback se GPS não autorizado)
  async function getLocationByIP(ip) {
    try {
      const res = await fetch(`https://ipapi.co/${ip}/json/`);
      if (!res.ok) return null;
      const data = await res.json();
      return {
        city: data.city,
        region: data.region,
        country: data.country_name,
        latitude: data.latitude,
        longitude: data.longitude,
      };
    } catch {
      return null;
    }
  }

  // Função para pegar localização GPS
  function getLocationByGPS() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        () => resolve(null),
        { timeout: 10000 }
      );
    });
  }

  const ips = await getIPs();
  let location = false; //await getLocationByGPS();

  if (!location && (ips.ipv4 || ips.ipv6)) {
    location = await getLocationByIP(ips.ipv4 || ips.ipv6);
  }

  const deviceInfo = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    cookiesEnabled: navigator.cookieEnabled,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };

  const accessTime = new Date().toISOString();

  const payload = {
    embeds: [
      {
        title: 'Analytics - Novo acesso',
        color: 0x00ff00,
        fields: [
          { name: 'Página', value: window.location.pathname, inline: true },
          { name: 'User Agent', value: deviceInfo.userAgent, inline: false },
          { name: 'Plataforma', value: deviceInfo.platform, inline: true },
          { name: 'Idioma', value: deviceInfo.language, inline: true },
          {
            name: 'Cookies habilitados',
            value: deviceInfo.cookiesEnabled ? 'Sim' : 'Não',
            inline: true,
          },
          {
            name: 'Resolução da tela',
            value: `${deviceInfo.screenWidth}x${deviceInfo.screenHeight}`,
            inline: true,
          },
          {
            name: 'Tamanho da viewport',
            value: `${deviceInfo.viewportWidth}x${deviceInfo.viewportHeight}`,
            inline: true,
          },
          { name: 'Fuso horário', value: deviceInfo.timezone, inline: true },
          { name: 'IP IPv4', value: ips.ipv4 || 'Não disponível', inline: true },
          { name: 'IP IPv6', value: ips.ipv6 || 'Não disponível', inline: true },
          {
            name: 'Localização',
            value: location
              ? `Cidade: ${location.city || 'N/A'}\nRegião: ${
                  location.region || 'N/A'
                }\nPaís: ${location.country || 'N/A'}\nLatitude: ${
                  location.latitude || 'N/A'
                }\nLongitude: ${location.longitude || 'N/A'}`
              : 'Não disponível',
            inline: false,
          },
          { name: 'Tempo de acesso', value: accessTime, inline: true },
        ],
        timestamp: accessTime,
      },
    ],
  };

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error('Erro ao enviar dados para o Discord:', res.statusText);
    } else {
      console.log('Dados enviados para o Discord com sucesso!');
    }
  } catch (err) {
    console.error('Erro na requisição:', err);
  }
})();