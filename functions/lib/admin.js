'use strict';


const admin = require('firebase-admin');
var configs = require('./twilio-configs');


const config = {
  apiKey: configs.apiKey,
  authDomain: "tel-mkpartners-com.firebaseapp.com",
  databaseURL: "https://tel-mkpartners-com.firebaseio.com",
  projectId: "tel-mkpartners-com",
  storageBucket: "tel-mkpartners-com.appspot.com",
  messagingSenderId: "1069990093776",
  credential: admin.credential.cert({
    "type": "service_account",
    "project_id": "tel-mkpartners-com",
    "private_key_id": "886f7235abb49482bb79fdc7c94801d06477c773",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEuwIBADANBgkqhkiG9w0BAQEFAASCBKUwggShAgEAAoIBAQCX27Zlv0KmSBUS\nxsKCzvOdQKHPzfUHsHMZ36u9t+xWPHyigbAaUX642OyV6XycyeuZx3IipmSTA955\nzQQjcmd37+5NAiPtg689q/peQUau0GELXScveqxMoAQY+XBVFtTByKj7cslDjQ4Z\n0F5llbrygjTx8AVoukG2VGwOyxIMuKHXK+k64nHhuc+d4iwvWqP23HxX+9Srrv7K\nM+5x6NqAaU9Vtoi1ReSGiBAb9GWgJxwl922FnbdYOKu0tiJlQidID78jxPXxS9fY\n2ddK/Uu4FKciHGheVdBAD70Rr5rtvw/p8XDasbJx+/adp+HKHVUhOyvi+N2Als4n\nE1PIyU6rAgMBAAECgf9FWwo3j3nX7pIZNwqX0T6mJeftsN49rhCDH0I4pKR2mTSs\nLHUAm0anbD7kMXMW4jQ/t+DSmWss8Ya7GkJYc641xWhKTNMyH6KzyOig6FRLhrdn\nkWEiHA+GYoOaQSlj9gtPiIBedLrmZ4em0zemcHdtwXleCcFNSUXBPYM2myuz5b62\nP+7b+/zntzZX2wTmInJ1//r7Vesgz0vsZ2cQ5vq8CTF5o5q0thbFuYG/7u/wQq/3\nrX5Tb+5OQTNT2OcmryGKh2kOId1SnmGXek7uddrE43JxjCy27vGfvZtjESSgLzSC\nNNGdpXy/EJzrDQm4lZshfJt74CUkou8pvFmFh3UCgYEAx8weculDqojGmZ2u8/TY\niZqZP3tvJh2lumodrQKI8rTTfqxfKfUh56PAEQNMy/lNHHuO2UuKN3D6EY8f2ZUm\ngaT5h9xKhpwNO57NXnu8YIWm+WmdSRTfFGhjrdK2km5Yibps47TRslRBliNQsfCh\nmcg1nwl6q8HFCRO64dha3K8CgYEAwpNizlfkzBhv1g5tIYm9hoRYa6i4mHgZ8tIP\nAT44YOtU286Y3bOhGOC22kePGyFVXigwa0jG9FYnrYutGmBUt/H844Me76VLURWQ\nXSGpNxL5JQVhObeXkB3jZxI24IWBhJbDH9rXQS4NE+W+lloo0Dt7cAmazdvjcytc\nDPFxRMUCgYEAsj/sZm6v3OQ78u8YGDQ4P8O6t0VDa4kFw2NK6ICbd5VWHuxf1ooJ\nXqTcBRGhoVTgs+mUD07yl/XmVGYRb0g+22k46jniD2gH8koCRSo1bROwXVIZbgr9\n3zImw/x6v/dMbEvzO8+lSekbvnvxUV8yfYV+OU32sGemhyugDj+9CKcCgYAvmqOX\n3EUr8eaatljY1bw6xvJjFJplIy0mDWKCaVidzbWrOXaI90O4tHHIIa3Pc25RZP/D\nn8CdUt7ORNgLFfpkLp4yg4f0FbrBkccKIgwmX0v5VMGev14jckyKkRhAAinX6JLA\nnmf/mGa2sYTZgCFwIL1ogdEQAHY7XSZePEv8CQKBgHUISrhH6BnZ2L+40q2YP4HY\n5JDktJ8Qf6TfEuP5PZmNRHwX2UjLLI7IbLipwcKHqEx0EQEUwGWSGf+kKApGDu2h\nxgqw/S//7CYsjMLYqJbyee4JOvVlWWf0j2VNUB1QmoHrV5F0VNJnaB45b/v/HT8G\nxbe6ngDP9fpY8qptIVbS\n-----END PRIVATE KEY-----\n",
    "client_email": "tel-mkpartners-com@appspot.gserviceaccount.com",
    "client_id": "",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/tel-mkpartners-com%40appspot.gserviceaccount.com"
  }),
};
console.log(125);
admin.initializeApp(config);
console.log(126);
console.log('Firebase Admin Initialized');

module.exports = {
  admin,
};
