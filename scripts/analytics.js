(async () => {
  // Webhook URL
  const WEBHOOK_URL = atob('aHR0cHM6Ly9kaXNjb3JkLmNvbS9hcGkvd2ViaG9va3MvMTU2MDQyMTEwNDE3NzM4OTY5MC91RXpOR0pTMzBNOUNLenhWQ3plN3pQUS1zRHk4QWEwelpNNkhDc09IN2pJNE1hNk02X1hFZHppdDdKWERqdmx2U0FXdw=='); //atob because of bots

  // grab ipv6 and ipv4
  async function getIPs() {
    const ips = { ipv4: null, ipv6: null };
    try {
      const res4 = await fetch('https://api64.ipify.org?format=json');
      const data4 = await res4.json();
      ips.ipv4 = data4.ip;
	  console.log("IPv4 Ok")
    } catch {
	  console.log("Failed grabbing IPv4");
	}

    try {
      const res6 = await fetch('https://api64.ipv6ify.com/');
      if (res6.ok) {
        ips.ipv6 = await res6.text();
		console.log("IPv6 Ok")
      } else {
	    console.log("Failed grabbing IPv6 - response not OK")
	  }
    } catch {
		console.log("Failed grabbing IPv6 - exception");
	}

    return ips;
  }

  // Get rough location by IP
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
  
  // Generate Time-based UUID v7 or get it from localStorage
  function getOrCreateTimeBasedID() {
	console.log("Read device_id from localStorage");
    let deviceId = localStorage.getItem('device_id');
    
    if (!deviceId) {
		console.log("deviceId not found in localStorage, generating");
        deviceId = generateUUIDv7();
		console.log("Generated ID: ", deviceId)
        localStorage.setItem('device_id', deviceId);
		console.log("Saved to localStorage")
    } else {
		console.log("device_id ok");
	}
    
    return deviceId;
  }

  function generateUUIDv7() {
	console.log("Generating UUID v7");
    // 1. Get current Unix timestamp in milliseconds
    const now = Date.now();
	
	console.log("Date is: ", now);
    
    // 2. Generate random bytes for the rest of the UUID
    const randomBytes = new Uint8Array(10);
    crypto.getRandomValues(randomBytes);
	
	console.log("Generated random: ", randomBytes);
    
    // 3. Format timestamp to hex (48 bits / 12 hex chars)
    let hex = now.toString(16).padStart(12, '0');
	
	console.log("Timestamp Date -> hex: ", hex);
    
    // 4. Add version 7 marker ('7') and variant ('8', '9', 'a', or 'b')
    // We modify the random bytes to inject these standard UUID markers
    const varByte = (randomBytes[2] & 0x3f) | 0x80; 
    
    // 5. Construct the final UUID string
    let UUID = [
        hex.slice(0, 8),
        hex.slice(8, 12),
        '7' + randomBytes[0].toString(16).padStart(2, '0').slice(-3),
        varByte.toString(16).padStart(2, '0') + randomBytes[1].toString(16).padStart(2, '0'),
        Array.from(randomBytes.slice(3, 9)).map(b => b.toString(16).padStart(2, '0')).join('')
    ].join('-');
	
	console.log("Generated UUID: ", UUID);
	
	return UUID;
  }

  const ips = await getIPs();
  
  location = await getLocationByIP(ips.ipv4 || ips.ipv6);
  
  uuid = getOrCreateTimeBasedID();

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
        title: 'HouseY2K Analytics 1.1 - New access',
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
		  { name: "UUID", value: uuid, inline: true }
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
      console.error('Error sending to discord:', res.statusText);
    } else {
      console.log('Data sent to discord ok!');
    }
  } catch (err) {
    console.error('Request error:', err);
  }
})();