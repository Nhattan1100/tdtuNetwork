module.exports={
    port: process.env.PORT || 3000,
    googleAuth:{
        clientID: '349326790580-qoojsr3a1tfk5g5tfvfgkjk2qelv7gla.apps.googleusercontent.com',
        clientSecret: 'RvGYnH42ehBDFi-d7PVMp_tI',
        callbackURL: 'http://localhost:3000/auth/google/callback'
        //callbackURL: 'https://tdtu-network.herokuapp.com/auth/google/callback'
    },
    //domain: 'https://tdtu-network.herokuapp.com',
    domain: 'http://ec2-3-21-163-206.us-east-2.compute.amazonaws.com:3000',
    privateKey:'aksdfbkasbfKHBKBKDFbbdfkbab&#uib3brjnbljdbfa4ugIGiukYF87o3ueljbf813ekwjdbask',
    mongoUrl: 'mongodb+srv://nqc93231:1112000a@nqc.6dqnp.mongodb.net/FinalProject?retryWrites=true&w=majority',
    // mongoUrlO: 'mongodb://127.0.0.1:27017/FinalProject'
    mongoUrlO: 'mongodb://ec2-3-21-163-206.us-east-2.compute.amazonaws.com:27017/FinalProject'
}
