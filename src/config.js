// Application configuration for the Muhuru Bay Mission 2026 Attendance Poster Generator
// Easily customize this file to adapt the app for different events.

export const CONFIG = {
  // --- Event Details ---
  event: {
    title: "Muhuru Bay Mission 2026",
    date: "17th - 23rd August, 2026",
    venue: "Muhuru Bay, Migori County, Kenya",
    description: "Join KCA University Christian Union and Prayer and Ministry of Word as we journey to Muhuru Bay for a week of evangelism, discipleship, prayer, worship, and community outreach under the theme 'Repentance and Healing' (2 Chronicles 7:14).",
    organizer: "KCA University Christian Union (KCAU CU)"
  },

  // --- Payment / Support Details ---
  payment: {
    tillNumber: "300078",
    tillName: "C-02756",
    amount: "Ksh. 2,000",
    paybillNumber: "300078",
    accountNumber: "C-02756"
  },

  // --- Branding Assets ---
  branding: {
    logo: "/logo.png",
    partners: [
      { name: "Prayer and Ministry of Word", logo: "/partner1.jpeg" },
      { name: "GUC", logo: "/partner2.png" },
      { name: "New Testament Faith", logo: "/partner3.png" },
      { name: "KUCCU", logo: "/partner4.jpeg" }
    ]
  },

  // --- Canvas Coordinates & Rendering Settings ---
  // Template image is 4500 x 5625 pixels (portrait A4-ish format)
  canvas: {
    width: 4500,
    height: 5625,
    templateUrl: "/template.png",

    // Circular profile photo settings — right-side circle on the poster
    photo: {
      centerX: 3230,     // X coordinate of the circle center
      centerY: 2870,     // Y coordinate of the circle center
      radius: 860,       // Radius of the circle (calibrated to the gold ring)
      borderColor: "#cbae2d",  // KCAU Gold border
      borderWidth: 20,    // Template already has the gold ring drawn — no extra border needed
      borderwidthcolor: "#192c57", // KCAU Gold border
      placeholderBg: "#192c57" // Navy fill if no photo uploaded
    },

    // Attendee name rendering settings — gold rectangle below the circle
    name: {
      centerX: 3200,

      // Vertical center of gold rectangle
      centerY: 4100,

      // Leave padding on both sides
      maxWidth: 1900,

      fontFamily: "'Futura-Bold', 'Futura Medium', 'Jost', 'Outfit', sans-serif",

      fontSize: 245,
      minFontSize: 55,

      fontWeight: "bold",

      // Navy text on gold
      color: "#192c57",

      //bannerBgColor: "#cbae2d",

      letterSpacing: 2,

      textTransform: "uppercase",

      bannerWidth: 1860,
      bannerHeight: 300
    }
  }
};
