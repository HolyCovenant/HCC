/* Holy Covenant Church: site settings.
   This is the only code file that should ever need editing. */
window.HCC = {

  // The "Publish to web" CSV link for the Website tab of the service schedule.
  sheetCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSWyV7bGVrorfWzwJE-v7aH5KK9rX1hfd858VdZ2Gnnq37PN-sZSpdSF-RT4w-GOnAgyo23vggpILHT/pub?gid=693929861&single=true&output=csv",

  // Folder holding the sermon series pictures, and the picture used when the
  // one named in the sheet is missing.
  seriesFolder: "series-images/",
  defaultImage: "hcc.jpg",

  // Contact form check (Cloudflare Turnstile). Paste the SITE KEY between the
  // quotes to switch it on; leave it empty for no check. The SECRET key never
  // goes here: it belongs only in Formspree's CAPTCHA settings.
  turnstileSiteKey: "0x4AAAAAAGXSSyL0eg52d32-",

  // The elders. A preacher's name on the home page links to his profile on the
  // Leadership page when it matches one of these. The id is the last name in
  // lower case and must match the id on his entry in leadership.html.
  elders: [
    { id: "bair", name: "Daniel Bair" },
    { id: "dicicco", name: "John DiCicco" },
    { id: "godoy", name: "Dan Godoy" },
    { id: "papendorf", name: "Dave Papendorf" },
    { id: "williams", name: "Tad Williams" }
  ],

  // How many upcoming services to list at the bottom of the home page.
  upcomingCount: 5,

  // A saved sample of the sheet. It is used only when a page is opened straight
  // from a folder on a computer, where browsers refuse to read the live sheet.
  // The published site never uses it.
  previewCsv: [
    "Date,Season,Text,PreacherRaw,Preacher,Image",
    "11/15/2026,Ordinary,Acts 27:1-28:16,Godoy,Pastor Godoy,acts.jpg",
    "11/22/2026,Ordinary,Acts 28:17-31,Papendorf,Pastor Papendorf,acts.jpg",
    "11/29/2026,Advent 1,Isaiah 64,Bair,Pastor Bair,advent.jpg",
    "12/6/2026,Advent 2,Isaiah 40:1-11,Papendorf,Pastor Papendorf,advent.jpg",
    "12/13/2026,Advent 3,Isaiah 61,Bair,Pastor Bair,advent.jpg",
    "12/20/2026,Advent 4,2 Samuel 7:1-17,DiCicco,Pastor DiCicco,advent.jpg",
    "12/20/2026,\"Lessons & Carols, 6:00pm\",Isaiah 11:1-10,Williams,Pastor Williams,advent.jpg",
    "12/27/2026,Christmas,Isaiah 9:2-7,Papendorf,Pastor Papendorf,christmas.jpg"
  ].join("\n")
};
