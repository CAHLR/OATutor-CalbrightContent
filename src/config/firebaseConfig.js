// const config = {
//     apiKey: "AIzaSyDKr8r7o0vivu85fyRhn7bIn6j5GxljX8w",
//     authDomain: "oatutor-askoski.firebaseapp.com",
//     databaseURL: "https://oatutor-askoski.firebaseio.com",
//     projectId: "oatutor-askoski",
//     storageBucket: "oatutor-askoski.appspot.com",
//     messagingSenderId: "1050614582892",
//     appId: "1:1050614582892:web:f7ffec360148dc17da1249",
//     measurementId: "G-44V1SE1GEF",
// };


const config = JSON.parse(process.env.REACT_APP_FIREBASE_CONFIG || "{}");
export default config;


// import { initializeApp, getApps } from "firebase/app";

// let config = {};
// try {
//   config = JSON.parse(process.env.REACT_APP_FIREBASE_CONFIG || "{}");
// } catch (err) {
//   console.error("Invalid Firebase config:", err);
// }

// let app;
// if (!getApps().length) {
//   app = initializeApp(config);
// }

// export default config;
// export { app };
