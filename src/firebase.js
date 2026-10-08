import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyB7KRB8o1J2Ghsw63FRViQDoANRw8WcItY',
  authDomain: 'prueba-eliminar-33df2.firebaseapp.com',
  projectId: 'prueba-eliminar-33df2',
  storageBucket: 'prueba-eliminar-33df2.firebasestorage.app',
  messagingSenderId: '1095573367138',
  appId: '1:1095573367138:web:18ac9fa3440be72528e43b',
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
