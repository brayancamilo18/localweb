/**
 * Datos ficticios completos para previews de landing y demos standalone.
 * Se activa con ?landingDemo=1 (junto a ?embed=1&preview=1).
 * Llama a applyLivePreviewData() definida en cada plantilla.
 */
(function () {
  'use strict';

  var params = new URLSearchParams(window.location.search);
  if (params.get('landingDemo') !== '1') return;

  if (params.get('embed') === '1') {
    document.documentElement.classList.add('embed-preview-root');
    document.body.classList.add('embed-preview');
  }
  if (params.get('preview') === '1') {
    document.documentElement.classList.add('lw-preview-inert');
  }

  var STANDARD_HORARIO = {
    mon: { open: '10:00', close: '20:00' },
    tue: { open: '10:00', close: '20:00' },
    wed: { open: '10:00', close: '20:00' },
    thu: { open: '10:00', close: '21:00' },
    fri: { open: '10:00', close: '21:00' },
    sat: { open: '10:00', close: '18:00' },
    sun: { closed: true },
  };

  var U = function (id, w) {
    return 'https://images.unsplash.com/' + id + '?auto=format&fit=crop&w=' + (w || 900) + '&q=75';
  };

  var G = {
    hair: [
      U('photo-1560066984-138dadb4c035', 800),
      U('photo-1521590832167-7bcbfaa6381f', 700),
      U('photo-1522337360788-8b13dee7a37e', 700),
      U('photo-1605497788044-5a32c7078486', 900),
      U('photo-1492106087820-71f1a00d2b11', 700),
      U('photo-1487412947147-5cebf100ffc2', 700),
    ],
    restaurant: [
      U('photo-1414235077428-338989a2e8c0', 900),
      U('photo-1517248135467-4c7edcad34c4', 800),
      U('photo-1559339352-11d035aa65de', 800),
      U('photo-1424847651672-bf20a4b0982b', 800),
      U('photo-1540189549336-e6e99c3679fe', 800),
      U('photo-1504674900247-0877df9cc836', 800),
    ],
    barber: [
      U('photo-1500648767791-00dcc994a43e', 900),
      U('photo-1621605815971-fbc98d665033', 800),
      U('photo-1560066984-138dadb4c035', 800),
      U('photo-1502823403499-6ccfcf4fb453', 800),
      U('photo-1522337360788-8b13dee7a37e', 800),
      U('photo-1492106087820-71f1a00d2b11', 800),
    ],
    spa: [
      U('photo-1540555700478-4be289fbecef', 900),
      U('photo-1564501049412-61c2a3083791', 800),
      U('photo-1544161515-4ab6ce6db874', 800),
      U('photo-1540541338287-41700207dee6', 800),
      U('photo-1582719508461-905c673771fd', 800),
      U('photo-1578683010236-d716f9a3f461', 800),
    ],
    cafe: [
      U('photo-1495474472287-4d71bcdd2085', 900),
      U('photo-1509042239860-f550ce710b93', 800),
      U('photo-1442512595331-e89e73853f31', 800),
      U('photo-1554118811-1e0d58224f24', 800),
      U('photo-1511920170033-f8396924c348', 800),
      U('photo-1501339847302-ac426a4a7cbb', 800),
    ],
    clinic: [
      U('photo-1629909613654-28e377c37b09', 900),
      U('photo-1588776814546-1ffcf47267a5', 800),
      U('photo-1579684385127-1ef15d508118', 800),
      U('photo-1559185590-765cdc663325', 800),
      U('photo-1572177812156-58036aae439c', 800),
      U('photo-1600585154340-be6161a56a0c', 800),
    ],
    fashion: [
      U('photo-1445205170230-053b83016050', 900),
      U('photo-1515886657613-9f3515b0c78f', 800),
      U('photo-1490481651871-ab68de25d43d', 800),
      U('photo-1492707892479-7bc8d5a4ee93', 800),
      U('photo-1521577352947-9bb58764b69a', 800),
      U('photo-1535868463750-c78d9543614f', 800),
    ],
    flowers: [
      U('photo-1481349518771-20055b2a7b24', 900),
      U('photo-1416879595882-3373a0480b5b', 800),
      U('photo-1466637574441-749b8f19452f', 800),
      U('photo-1650044252595-cacd425982ff', 800),
      U('photo-1630595632518-8217c0bceb8f', 800),
      U('photo-1757689314932-bec6e9c39e51', 800),
    ],
    gym: [
      U('photo-1571902943202-507ec2618e8f', 900),
      U('photo-1600607687939-ce8a6c25118c', 800),
      U('photo-1572177812156-58036aae439c', 800),
      U('photo-1600585154340-be6161a56a0c', 800),
      U('photo-1559185590-765cdc663325', 800),
      U('photo-1546069901-ba9599a7e63c', 800),
    ],
    craft: [
      U('photo-1504307651254-35680f356dfd', 900),
      U('photo-1581578731548-c64695cc6952', 800),
      U('photo-1503387762-592deb58ef4e', 800),
      U('photo-1621905252507-b35492cc74b4', 800),
      U('photo-1605812860427-4024433a70fd', 800),
      U('photo-1504917595217-d4dc5ebe6122', 800),
    ],
    pet: [
      U('photo-1581244277943-fe4a9c777189', 900),
      U('photo-1565299624946-b28f40a0ae38', 800),
      U('photo-1546069901-ba9599a7e63c', 800),
      U('photo-1671493228689-754b0f200c84', 800),
      U('photo-1685022036259-04cf91a89af1', 800),
      U('photo-1516549655169-df83a0774514', 800),
    ],
    travel: [
      U('photo-1658476293101-4181a2afc8f4', 900),
      U('photo-1552364708-8a19ac4e8923', 800),
      U('photo-1693620714112-a79a7d27308b', 800),
      U('photo-1632178151697-fd971baa906f', 800),
      U('photo-1469854523086-cc02fe5d8800', 800),
      U('photo-1486406146926-c627a92ad1ab', 800),
    ],
    luxe: [
      U('photo-1600607687939-ce8a6c25118c', 900),
      U('photo-1492707892479-7bc8d5a4ee93', 800),
      U('photo-1490481651871-ab68de25d43d', 800),
      U('photo-1777628530456-bb93d3a03faf', 800),
      U('photo-1605812860427-4024433a70fd', 800),
      U('photo-1521577352947-9bb58764b69a', 800),
    ],
  };

  function demoBase(extra) {
    var o = {
      horario: STANDARD_HORARIO,
      map_lat: 40.4168,
      map_lon: -3.7038,
      ciudad: 'Madrid',
      pais: 'España',
      correo: 'contacto@ejemplo.es',
      anio_fundacion: '2018',
      is_pro: false,
      vcard_enabled: false,
      instagram_url: '',
      tiktok_url: '',
      facebook_url: '',
      google_business_url: '',
    };
    for (var k in extra) {
      if (Object.prototype.hasOwnProperty.call(extra, k)) o[k] = extra[k];
    }
    return o;
  }

  var DEMO = {
    'bloom-studio': demoBase({
      nombre: 'Mono Studio',
      tagline: 'Peluquería · Chamberí, Madrid',
      telefono: '+34 913 00 44 55',
      descripcion:
        'Salón luminoso en Chamberí: coloración, tratamientos de recuperación y cortes a medida. Cita previa por WhatsApp.',
      direccion: 'Calle de Fuencarral, 42 · 28004 Madrid',
      map_lat: 40.4275,
      map_lon: -3.7015,
      portada: G.hair[0],
      foto_equipo: G.hair[2],
      galeria: G.hair,
      services: [
        { name: 'Corte mujer', price: 32, description: 'Lavado, corte y secado.' },
        { name: 'Corte hombre', price: 22, description: 'Tijera o máquina, acabado a navaja.' },
        { name: 'Color + tratamiento', price: 68, description: 'Diagnóstico, color y mascarilla reparadora.' },
        { name: 'Peinado evento', price: 45, description: 'Recogidos y styling para ocasiones especiales.' },
      ],
    }),
    'noir-elite': demoBase({
      nombre: 'Sal & Brasa',
      tagline: 'Restaurante · Lavapiés, Madrid',
      telefono: '+34 915 34 21 09',
      descripcion:
        'Brasa de encina, producto de temporada y carta corta que cambia cada semana. Reserva recomendada.',
      direccion: 'Plaza de Lavapiés, 8 · 28012 Madrid',
      map_lat: 40.4088,
      map_lon: -3.7006,
      portada: G.restaurant[0],
      foto_equipo: G.restaurant[1],
      galeria: G.restaurant,
      services: [
        { name: 'Menú del día', price: 18, description: 'Primer, segundo, postre y bebida.' },
        { name: 'Pulpo a la brasa', price: 22, description: 'Con cachelos y pimentón.' },
        { name: 'Steak tartar', price: 24, description: 'Solomillo, yema curada y pan crujiente.' },
        { name: 'Menú degustación', price: 42, description: 'Cinco pases. Maridaje opcional.' },
      ],
    }),
    'urban-bold': demoBase({
      nombre: 'Calle 14 Barber',
      tagline: 'Barbería · Malasaña, Madrid',
      telefono: '+34 914 00 55 66',
      descripcion:
        'Fades, degradados y barba a navaja en un local directo, sin rodeos. Walk-in algunos días; cita previa recomendada.',
      direccion: 'Calle del Pez, 14 · 28004 Madrid',
      map_lat: 40.4262,
      map_lon: -3.7045,
      portada: G.barber[0],
      foto_equipo: G.barber[2],
      galeria: G.barber,
      services: [
        { name: 'Corte fade', price: 22, description: 'Degradado limpio y perfilado.' },
        { name: 'Corte + barba', price: 28, description: 'Corte completo y arreglo de barba.' },
        { name: 'Afeitado clásico', price: 18, description: 'Toalla caliente y navaja.' },
        { name: 'Color barba', price: 15, description: 'Camuflaje de canas.' },
      ],
    }),
    'coastal-calm': demoBase({
      nombre: 'Marea Spa',
      tagline: 'Spa · Salamanca, Madrid',
      telefono: '+34 968 00 22 33',
      descripcion:
        'Rituales de bienestar, masajes y faciales en un espacio tranquilo pensado para desconectar en plena ciudad.',
      direccion: 'Calle de Serrano, 45 · 28001 Madrid',
      map_lat: 40.4290,
      map_lon: -3.6838,
      portada: G.spa[0],
      foto_equipo: G.spa[1],
      galeria: G.spa,
      services: [
        { name: 'Masaje relajante 60\'', price: 65, description: 'Aceites esenciales y presión media.' },
        { name: 'Facial hidratante', price: 55, description: 'Limpieza profunda e hidratación.' },
        { name: 'Ritual termal', price: 40, description: 'Sauna, contrastes y infusiones.' },
        { name: 'Pack pareja', price: 120, description: 'Dos masajes y acceso al circuito.' },
      ],
    }),
    'tavola-warm': demoBase({
      nombre: 'Café Pinón',
      tagline: 'Cafetería · Ríos Rosas, Madrid',
      telefono: '+34 915 12 34 56',
      descripcion:
        'Espresso de especialidad, brunch de fin de semana y repostería casera. Terraza pequeña cuando hace sol.',
      direccion: 'Calle de Ríos Rosas, 28 · 28003 Madrid',
      map_lat: 40.4410,
      map_lon: -3.6950,
      portada: G.cafe[0],
      portada_2: G.cafe[4],
      portada_3: U('photo-1555396273-367ea4eb4db5', 900),
      foto_equipo: G.cafe[2],
      galeria: G.cafe,
      is_pro: true,
      vcard_enabled: true,
      instagram_url: 'https://instagram.com/',
      tiktok_url: 'https://tiktok.com/',
      facebook_url: 'https://facebook.com/',
      services: [
        { name: 'Espresso', price: 1.8, description: 'Blend de la casa.' },
        { name: 'Brunch completo', price: 14, description: 'Huevos, aguacate, pan artesano y zumo.' },
        { name: 'Tarta del día', price: 4.5, description: 'Elaboración propia.' },
        { name: 'Menú mediodía', price: 12, description: 'Primer, segundo y bebida.' },
      ],
    }),
    'trust-clinic': demoBase({
      nombre: 'Clínica Dental Vega',
      tagline: 'Clínica dental · Retiro, Madrid',
      telefono: '+34 912 99 88 77',
      descripcion:
        'Odontología general, estética dental y ortodoncia invisible. Primera visita con radiografía panorámica incluida.',
      direccion: 'Calle de Alcalá, 89 · 28009 Madrid',
      map_lat: 40.4205,
      map_lon: -3.6750,
      portada: G.clinic[0],
      foto_equipo: G.clinic[1],
      galeria: G.clinic,
      services: [
        { name: 'Revisión + limpieza', price: 45, description: 'Exploración y profilaxis.' },
        { name: 'Blanqueamiento', price: 280, description: 'Tratamiento en clínica, dos sesiones.' },
        { name: 'Empaste composite', price: 75, description: 'Por pieza, según complejidad.' },
        { name: 'Consulta ortodoncia', price: 0, description: 'Estudio 3D sin compromiso.' },
      ],
    }),
    'tech-sleek': demoBase({
      nombre: 'Atelier 21',
      tagline: 'Tienda de ropa · Argüelles, Madrid',
      telefono: '+34 910 55 44 33',
      descripcion:
        'Moda contemporánea, básicos atemporales y accesorios seleccionados. Piezas limitadas cada temporada.',
      direccion: 'Calle de Ferraz, 21 · 28008 Madrid',
      map_lat: 40.4295,
      map_lon: -3.7180,
      portada: G.fashion[0],
      foto_equipo: G.fashion[1],
      galeria: G.fashion,
      services: [
        { name: 'Camisa premium', price: 89, description: 'Algodón orgánico, corte slim.' },
        { name: 'Pantalón tailored', price: 120, description: 'Lana ligera, ajuste a medida.' },
        { name: 'Chaqueta temporada', price: 195, description: 'Edición limitada.' },
        { name: 'Accesorio cuero', price: 65, description: 'Cinturones y pequeña marroquinería.' },
      ],
    }),
    'mono-edito': demoBase({
      nombre: 'Pétalo',
      tagline: 'Floristería · Conde Duque, Madrid',
      telefono: '+34 915 88 77 66',
      descripcion:
        'Ramos de temporada, plantas de interior y decoración floral para eventos. Entrega en el mismo día en Madrid centro.',
      direccion: 'Calle del Conde Duque, 12 · 28015 Madrid',
      map_lat: 40.4268,
      map_lon: -3.7105,
      portada: G.flowers[0],
      portada_2: G.flowers[3],
      portada_3: G.flowers[4],
      foto_equipo: G.flowers[1],
      galeria: G.flowers,
      is_pro: true,
      vcard_enabled: true,
      instagram_url: 'https://instagram.com/',
      tiktok_url: 'https://tiktok.com/',
      facebook_url: 'https://facebook.com/',
      services: [
        { name: 'Ramo de temporada', price: 35, description: 'Flores frescas del mercado.' },
        { name: 'Bouquet novia', price: 95, description: 'Consulta previa incluida.' },
        { name: 'Planta interior', price: 22, description: 'Maceta de cerámica incluida.' },
        { name: 'Centro de mesa', price: 48, description: 'Para eventos pequeños.' },
      ],
    }),
    'craft-pro': demoBase({
      nombre: 'Reformas Lanza',
      tagline: 'Reformas · Usera, Madrid',
      telefono: '+34 911 22 33 44',
      descripcion:
        'Reformas integrales, fontanería y electricidad con presupuesto cerrado y plazos claros. Equipo certificado.',
      direccion: 'Avenida de Rafaela Ybarra, 56 · 28041 Madrid',
      map_lat: 40.3880,
      map_lon: -3.7080,
      portada: G.craft[0],
      foto_equipo: G.craft[1],
      galeria: G.craft,
      services: [
        { name: 'Reforma baño', price: 4500, description: 'Llave en mano, materiales incluidos.' },
        { name: 'Instalación eléctrica', price: 850, description: 'Cuadro y puntos de luz.' },
        { name: 'Fontanería urgente', price: 65, description: 'Desplazamiento + primera hora.' },
        { name: 'Presupuesto integral', price: 0, description: 'Visita y mediciones sin coste.' },
      ],
    }),
    'versa-studio': demoBase({
      nombre: 'Estudio Versa',
      tagline: 'Estética · Chamberí, Madrid',
      telefono: '+34 911 23 45 67',
      descripcion:
        'Tratamientos faciales, corporales y depilación láser en un estudio íntimo con atención personalizada.',
      direccion: 'Calle de Ponzano, 33 · 28003 Madrid',
      map_lat: 40.4380,
      map_lon: -3.6980,
      portada: G.spa[0],
      portada_2: G.travel[1],
      portada_3: G.travel[2],
      foto_equipo: G.spa[2],
      galeria: G.spa,
      is_pro: true,
      vcard_enabled: true,
      instagram_url: 'https://instagram.com/',
      tiktok_url: 'https://tiktok.com/',
      facebook_url: 'https://facebook.com/',
      services: [
        { name: 'Limpieza facial profunda', price: 55, description: '60 minutos con masaje.' },
        { name: 'Depilación láser piernas', price: 120, description: 'Sesión completa.' },
        { name: 'Radiofrecuencia facial', price: 70, description: 'Efecto lifting suave.' },
        { name: 'Pack bienestar', price: 150, description: 'Facial + corporal.' },
      ],
    }),
    'luxe-atelier': demoBase({
      nombre: 'Maison Éclat',
      tagline: 'Gimnasio premium · Salamanca, Madrid',
      telefono: '+34 914 88 77 66',
      descripcion:
        'Entrenamiento personal, clases reducidas y zona de recuperación. Instalaciones boutique en pleno barrio de Salamanca.',
      direccion: 'Calle de Velázquez, 58 · 28001 Madrid',
      map_lat: 40.4310,
      map_lon: -3.6840,
      portada: G.gym[0],
      portada_2: G.gym[1],
      portada_3: G.gym[2],
      foto_equipo: G.gym[1],
      galeria: G.gym,
      is_pro: true,
      vcard_enabled: true,
      instagram_url: 'https://instagram.com/',
      tiktok_url: 'https://tiktok.com/',
      facebook_url: 'https://facebook.com/',
      services: [
        { name: 'Membresía mensual', price: 89, description: 'Acceso ilimitado y clases grupales.' },
        { name: 'Sesión personal', price: 45, description: '60 minutos one-to-one.' },
        { name: 'Clase pilates reformer', price: 22, description: 'Grupos de 4 personas.' },
        { name: 'Evaluación inicial', price: 0, description: 'Con plan de entrenamiento.' },
      ],
    }),
    'graphite-soft': demoBase({
      nombre: 'Nómada Store',
      tagline: 'Tienda de ropa · Malasaña, Madrid',
      telefono: '+34 910 55 44 33',
      descripcion:
        'Boutique de diseño independiente: prendas de autor, básicos premium y selección cuidada cada temporada.',
      direccion: 'Calle de la Palma, 19 · 28004 Madrid',
      map_lat: 40.4255,
      map_lon: -3.7020,
      portada: G.fashion[0],
      portada_2: U('photo-1441986300917-64674bd600d8', 900),
      portada_3: G.fashion[2],
      foto_equipo: G.fashion[2],
      galeria: G.fashion,
      services: [
        { name: 'Blazer estructurado', price: 145, description: 'Lana y viscosa, corte recto.' },
        { name: 'Pantalón wide leg', price: 98, description: 'Talle alto, pernera amplia.' },
        { name: 'Jersey de punto', price: 72, description: 'Lana merino, colores tierra.' },
        { name: 'Bolso de piel', price: 185, description: 'Hecho a mano en España.' },
      ],
    }),
    'kairos-bold': demoBase({
      nombre: 'Kairos Burger',
      tagline: 'Fast-casual bold · Madrid',
      telefono: '+34 915 44 33 22',
      descripcion:
        'Hamburguesas smash, patatas crujientes y salsas caseras. Ingredientes top y pedido rápido por WhatsApp.',
      direccion: 'Calle de Fuencarral, 45 · 28004 Madrid',
      map_lat: 40.4268,
      map_lon: -3.7038,
      portada: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80',
      portada_2: 'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=1000&q=80',
      portada_3: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1000&q=80',
      foto_equipo: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80',
      galeria: [
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1576107232684-1279f390859f?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1551782450-a2132b4ba21d?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1571091718767-18b5b1457add?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=900&q=80',
      ],
      is_pro: true,
      vcard_enabled: true,
      instagram_url: 'https://instagram.com/',
      tiktok_url: 'https://tiktok.com/',
      facebook_url: 'https://facebook.com/',
      services: [
        { name: 'Smash burger clásica', price: 11, description: 'Doble carne, cheddar fundido y salsa de la casa.' },
        { name: 'Patatas loaded', price: 6, description: 'Crujientes, bacon y salsa ranch.' },
        { name: 'Tacos al pastor', price: 9, description: 'Tortilla de maíz, piña y cilantro.' },
        { name: 'Malteada Oreo', price: 5, description: 'Helado artesano y galleta triturada.' },
        { name: 'Combo Kairos', price: 14, description: 'Burger + patatas + bebida.' },
      ],
    }),
    'la-republica-vintage': demoBase({
      nombre: 'La República',
      tagline: 'Soda fountain y cocina americana · Madrid',
      about_title: 'Una casa con oficio, abierta desde 1987',
      anio_fundacion: '1987',
      about_sections: [
        {
          title: 'La barra de siempre',
          description: 'Cócteles clásicos, malteadas y especialidades de la casa servidas con el mismo oficio de toda la vida.',
          image_url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80',
        },
      ],
      telefono: '+34 915 12 34 56',
      descripcion:
        'Recetas de siempre, producto de mercado y trato de barrio. Pan recién horneado, café de tueste natural y especialidades de la casa.',
      direccion: 'Calle de la Cava Baja, 12 · 28005 Madrid',
      map_lat: 40.4138,
      map_lon: -3.7087,
      portada: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=80',
      portada_2: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80',
      portada_3: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80',
      foto_equipo: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=1200&q=80',
      galeria: [
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1466637574441-749b8f19452f?auto=format&fit=crop&w=900&q=80',
      ],
      is_pro: true,
      vcard_enabled: true,
      instagram_url: 'https://instagram.com/',
      tiktok_url: 'https://tiktok.com/',
      facebook_url: 'https://facebook.com/',
      services: [
        { name: 'Sándwich de la casa', price: 12, description: 'Pan de masa madre, pickles y mostaza de Dijon.' },
        { name: 'Malteada clásica', price: 6, description: 'Vainilla, chocolate o fresa.' },
        { name: 'Tarta del día', price: 5, description: 'Receta casera según temporada.' },
        { name: 'Menú del mediodía', price: 16, description: 'Entrante, plato y bebida.' },
      ],
    }),
    'wild-pet': demoBase({
      nombre: 'Patitas Felices',
      tagline: 'Peluquería canina · Tetuán, Madrid',
      telefono: '+34 915 88 77 66',
      descripcion:
        'Peluquería, baños terapéuticos y guardería con trato cercano. Tu mascota sale limpia, feliz y oliendo bien.',
      direccion: 'Calle de Bravo Murillo, 120 · 28020 Madrid',
      map_lat: 40.4560,
      map_lon: -3.6980,
      portada: G.pet[0],
      portada_2: G.pet[1],
      portada_3: G.pet[2],
      foto_equipo: G.pet[1],
      galeria: G.pet,
      services: [
        { name: 'Baño y corte raza pequeña', price: 28, description: 'Incluye uñas y oídos.' },
        { name: 'Baño raza mediana', price: 35, description: 'Champú hipoalergénico.' },
        { name: 'Baño raza grande', price: 45, description: 'Secado profesional.' },
        { name: 'Guardería día completo', price: 22, description: 'Paseos incluidos.' },
      ],
    }),
  };

  function detectSlug() {
    var path = (window.location.pathname || '').split('/').pop() || '';
    return path.replace(/\.html$/i, '').toLowerCase();
  }

  function boot() {
    if (typeof applyLivePreviewData !== 'function') return;
    var slug = detectSlug();
    var payload = DEMO[slug];
    if (!payload) return;
    applyLivePreviewData(payload, { alignToHash: false });
    if (typeof window.tvAnimationsRefresh === 'function') {
      requestAnimationFrame(function () { window.tvAnimationsRefresh(); });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(boot, 80);
    });
  } else {
    setTimeout(boot, 80);
  }
})();
