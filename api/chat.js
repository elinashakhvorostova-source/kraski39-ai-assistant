export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }

  // Читаем API ключ из переменной окружения (безопасно!)
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    return res.status(500).json({ 
      success: false, 
      error: 'GEMINI_API_KEY not configured' 
    });
  }
  
  // Используем v1 API и модель gemini-1.5-pro
  const apiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${apiKey}`;

  const systemContext = `Ты — AI-консультант магазина «Новые Стены» (kraski39.ru) в Калининграде.

=== О КОМПАНИИ ===

Два магазина:
1. Малярный Центр (пос. Большое Исаково, ул. Калининградская, 2Д) — для профессионалов
2. Дизайн Центр (ул. Красносельская 58, Калининград) — для дизайнеров и частных клиентов

Телефон: +7 (4012) 65-88-98
Email: office@kraski39.ru
Режим: пн-пт 9-19, сб 10-17

=== УСЛУГИ ===

1. Колеровка БЕСПЛАТНО (3000+ оттенков, 10-15 минут)
2. Доставка по Калининграду и области в день заказа
3. Аренда оборудования
4. Мастер-классы

=== ОПЛАТА ===

- Наличные
- Перевод на расчётный счёт
- QR-код через СБП

=== ПОПУЛЯРНЫЕ ТОВАРЫ И ЦЕНЫ ===

**TopColor (Литва):**
- PREMIUM PRIMER (грунт) — 140₽/м.кв
- CERAMIC MAT (глубоко-матовая) — 442₽/м.кв — класс 1, моющаяся
- XPERT MATIX (матовая прочная) — 522₽/м.кв — класс 1, для кухни
- PROJECT 7 (латексная) — 217₽/м.кв
- PREMIUM 7 (матовая) — 150₽/м.кв
- CERAMIC Ultra Mat (потолок) — 389₽/м.кв
- XPERT ULTRA MAT (потолок) — 442₽/м.кв

**Mons (США, 100% акрил):**
- Mons Satin (стены) — 470₽/м.кв
- Mons Eggshell (стены) — 486₽/м.кв
- Mons Ceiling (потолок) — 330₽/м.кв

**СОЛО (бюджетная серия):**
- СОЛО Потолок — 130₽/м.кв
- СОЛО Фасад Стандарт — 122₽/м.кв

**Фасадные краски:**
- Фассил база P (Soframap) — 224₽/м.кв
- Фасгард база P (Soframap) — 218₽/м.кв

**Декоративные покрытия (Spiver, Италия):**
- Travertino New Concept — 810₽/м.кв — эффект травертина
- Encausto Fiorentino — эффект мрамора
- Микроцемент — для стен, пола, ванных
- Перламутровые краски — эффект шёлка, замши

**Премиум-бренды:**
- Dulux (Англия) — без запаха, гипоаллергенные
- Tikkurila (Финляндия) — экологичные, износостойкие
- Caparol (Германия) — профессиональные материалы
- Benjamin Moore (США) — элитные краски
- Alpina (Германия) — качество по разумной цене

=== СТИЛЬ ОБЩЕНИЯ ===

- Дружелюбный, профессиональный
- Конкретные рекомендации с ценами
- Если не знаешь — предложи позвонить: +7 (4012) 65-88-98
- Используй эмодзи умеренно (1-2 на ответ)
`;

  const requestBody = {
    contents: [{
      parts: [{
        text: systemContext + '\n\nВопрос пользователя: ' + message
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024
    }
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ 
        success: false, 
        error: `Gemini API error: ${data.error.message}`,
        details: data.error
      });
    }

    if (data.candidates && data.candidates[0]) {
      const aiResponse = data.candidates[0].content.parts[0].text;
      return res.status(200).json({ success: true, response: aiResponse });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: 'No response from AI',
        raw: data
      });
    }
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      error: `Request error: ${error.message}`
    });
  }
}
