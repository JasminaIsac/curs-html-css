/* Sursa afișată pe hub și în banda prelegerilor.
   Ține sincron cu course.json când schimbi statusul unei teme. */
window.ATELIER_COURSE = {
  brand: "atelier.web",
  title: "HTML & CSS",
  subtitle: "Curs interactiv — de la documentul HTML la layout și adaptație",
  themes: [
    {
      id: "01",
      slug: "01-introducere-web-html",
      title: "Introducere în web și structura documentului HTML",
      blurb: "Client, server, HTTP, documentul HTML, text, linkuri și imagini.",
      status: "ready"
    },
    {
      id: "02",
      slug: "02-html-semantic",
      title: "HTML semantic, tabele, formulare și media",
      blurb: "Landmark-uri, tabele, formulare, media, accesibilitate și SEO de bază.",
      status: "ready"
    },
    {
      id: "03",
      slug: "03-fundamente-css",
      title: "Fundamentele CSS",
      blurb: "Includere, selectori, cascadă, specificitate, unități, culori și text.",
      status: "ready"
    },
    {
      id: "04",
      slug: "04-box-model-flex-grid",
      title: "Modelul casetei și layout cu Flexbox și Grid",
      blurb: "Box model, display, Flexbox și CSS Grid pentru așezarea paginii.",
      status: "soon"
    },
    {
      id: "05",
      slug: "05-pozitionare-animatii",
      title: "Poziționare, transformări, tranziții și animații",
      blurb: "position, transform, transition și @keyframes în practică.",
      status: "soon"
    },
    {
      id: "06",
      slug: "06-adaptivitate",
      title: "Adaptivitate, responsivitate și bune practici",
      blurb: "Viewport, media queries, imagini fluide și obiceiuri de proiect.",
      status: "soon"
    }
  ]
};
