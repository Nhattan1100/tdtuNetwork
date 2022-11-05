const admin = require('firebase-admin')
var serviceAccount = require('./tdtu-network-firebase-adminsdk-yr6r1-86100514b6.json')
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'tdtu-network.appspot.com'
})
const bucket = admin.storage().bucket()

module.exports = {
    bucket
}