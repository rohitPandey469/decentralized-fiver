"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.admin = void 0;
// Import the functions you need from the SDKs you need
const app_1 = require("firebase-admin/app");
const storage_1 = require("firebase-admin/storage");
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCTj30aB-zOi4ZB4bggh7uacNj6lD5PH8s",
    authDomain: "codelabz-303fb.firebaseapp.com",
    databaseURL: "https://codelabz-303fb-default-rtdb.firebaseio.com",
    projectId: "codelabz-303fb",
    storageBucket: "codelabz-303fb.appspot.com",
    messagingSenderId: "986277623752",
    appId: "1:986277623752:web:e69a68423e12d0d70ab2fd",
    measurementId: "G-HVPYX6X7NM",
};
// Initialize Firebase
exports.admin = (0, app_1.initializeApp)(firebaseConfig);
exports.storage = (0, storage_1.getStorage)(exports.admin);
