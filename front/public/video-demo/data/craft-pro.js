/**
 * Demo Craft Bite — Craft Pro (temporal, solo grabación de vídeo).
 * Comida rápida · hamburguesas, pizza, pollo frito · Malasaña, Madrid.
 */
(function () {
  'use strict';

  var U = function (id, w) {
    return 'https://images.unsplash.com/' + id + '?auto=format&fit=crop&w=' + (w || 900) + '&q=80';
  };

  /** Smash burger — hero (URL verificada HTTP 200). */
  var HERO = U('photo-1568901346375-23c9450c58cd', 1400);

  /** 10 fotos comida rápida — todas comprobadas. */
  var GALLERY = [
    U('photo-1551782450-17144efb9c50', 900),
    U('photo-1565299624946-b28f40a0ae38', 900),
    U('photo-1555939594-58d7cb561ad1', 900),
    U('photo-1550547660-d9450f859349', 900),
    U('photo-1571091718767-18b5b1457add', 900),
    U('photo-1586190848861-99aa4a171e90', 900),
    U('photo-1513104890138-7c749659a591', 900),
    U('photo-1606755962773-d324e0a13086', 900),
    U('photo-1551782450-a2132b4ba21d', 900),
    U('photo-1626700051175-6818013e1d4f', 900),
  ];

  window.VIDEO_DEMO_CONFIG = {
    slug: 'craft-pro',
    title: 'Craft Bite',
    subtitle: 'Craft Pro · Comida rápida · Malasaña, Madrid',
    payload: {
      logo_url: '',
      logo_scale: 1.35,
      nombre: 'Craft Bite',
      tagline: 'Comida rápida · Malasaña, Madrid',
      telefono: '+34914433221',
      whatsapp: '34914433221',
      portada: HERO,
      portada_2: '',
      portada_3: '',
      descripcion:
        'Craft Bite es comida rápida sin atajos raros: smash burgers a la plancha, pizza de masa fermentada, pollo crujiente y patatas recién hechas. Pedido en mostrador, para llevar o por WhatsApp. Salsas caseras, ingredientes reconocibles y ticket medio honesto. Local pequeño, cola rápida y olor a brasa desde la calle.',
      about_title: 'Rápido, crujiente y sin rodeos',
      about_sections: [
        {
          title: 'La barra',
          description:
            'Pantalla con el menú del día, cervezas de grifo y mostrador para recoger. Pagas, esperas cinco minutos y sales con el pedido caliente.',
          image_url: GALLERY[0],
        },
        {
          title: 'Cocina',
          description:
            'Plancha para smash, horno de piedra para pizza y freidora con cambio de aceite diario. Preparamos al momento; nada congelado en hamburguesas.',
          image_url: GALLERY[5],
        },
        {
          title: 'Para llevar',
          description:
            'Envases resistentes y bolsas térmicas. Ideal para llevar al parque, pedir a casa o picar algo después del cine.',
          image_url: GALLERY[9],
        },
      ],
      foto_equipo: GALLERY[3],
      direccion: 'Calle de la Manuela, 8 · 28004 Madrid',
      ciudad: 'Madrid',
      pais: 'España',
      anio_fundacion: '2021',
      correo: 'hola@craftbite.es',
      galeria: GALLERY,
      horario: {
        mon: { open: '12:00', close: '23:30' },
        tue: { open: '12:00', close: '23:30' },
        wed: { open: '12:00', close: '23:30' },
        thu: { open: '12:00', close: '23:30' },
        fri: { open: '12:00', close: '00:30' },
        sat: { open: '12:00', close: '00:30' },
        sun: { open: '13:00', close: '23:00' },
      },
      map_lat: 40.4255,
      map_lon: -3.7025,
      services: [
        {
          name: 'Smash burger clásica',
          price: 9.5,
          description:
            'Doble smash, cheddar fundido, pepinillos, cebolla pochada y salsa de la casa en pan brioche tostado.',
        },
        {
          name: 'Double bacon cheese',
          price: 11.9,
          description:
            'Tres carnes a la plancha, bacon crujiente, doble queso americano y salsa ahumada. Para hambre grande.',
        },
        {
          name: 'Pizza margarita 30 cm',
          price: 10.5,
          description:
            'Masa 48 h, tomate San Marzano, mozzarella fior di latte y albahaca fresca. Horno a 400 °C.',
        },
        {
          name: 'Pizza BBQ chicken',
          price: 12.5,
          description:
            'Base BBQ, pollo marinado, cebolla morada, cilantro y mezcla de quesos. Uno de los más pedidos.',
        },
        {
          name: 'Bucket pollo crujiente (8 pzas)',
          price: 14.9,
          description:
            'Muslos y alitas empanadas, especias suaves y piel crujiente. Incluye salsa honey-mustard o picante.',
        },
        {
          name: 'Alitas picantes x6',
          price: 7.5,
          description:
            'Marinadas 12 horas, fritas y glaseadas en salsa buffalo. Con apio y blue cheese opcional (+1 €).',
        },
        {
          name: 'Patatas loaded',
          price: 5.5,
          description:
            'Patatas fritas gruesas, cheddar líquido, bacon bits y salsa ranch. Para compartir o no.',
        },
        {
          name: 'Combo familiar',
          price: 24.9,
          description:
            '2 smash burgers, pizza mediana a elegir, bucket pequeño de pollo y 4 bebidas. Válido de domingo a jueves.',
        },
        {
          name: 'Batido artesanal',
          price: 4.5,
          description:
            'Vainilla, chocolate o fresa. Helado de base y topping de nata montada. Tamaño grande.',
        },
      ],
      google_maps_url:
        'https://www.google.com/maps/dir/?api=1&destination=40.4255,-3.7025',
      google_business_url:
        'https://www.google.com/maps/place/?q=place_id:ChIJgTwBgJcpQg0RaHM096FkNQM',
      booking_url: '',
      vcard_enabled: true,
      vcard_download_url: '/video-demo/assets/craft-bite.vcf',
      is_pro: true,
      subdomain: 'craft-bite-demo',
      instagram_url: 'https://www.instagram.com/',
      tiktok_url: 'https://www.tiktok.com/',
      facebook_url: 'https://www.facebook.com/',
    },
  };
})();
