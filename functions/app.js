'use strict';

const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const conferenceRouter = require('./routes/conference');
const tokenRouter = require('./routes/token');
const transferRouter = require('./routes/transfer');
const actionRouter = require('./routes/action');
const incomingRouter = require('./routes/incoming');
const outgoingRouter = require('./routes/outgoing');
const callerIdRouter = require('./routes/callerid');
//const presenceRouter = require('./routes/presence');
const loginRouter = require('./routes/login');
const holdRouter = require('./routes/hold');
//const acceptRouter = require('./routes/accept');
const { authenticate } = require('./lib/authenticate');
var modelUpdater = require('./lib/model');



const app = express();
app.use(cookieParser());
app.use(cors());

// view engine setup, static file setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.use(express.static(path.join(__dirname, 'public')));



// routes
app.get('/', authenticate, function (req, res) {
  console.log('in app.get(/)');
  modelUpdater.checkForSip(req.agentId)
    .then((agentId) => {
      res.render('index', {
        currentAgentId: agentId,
        origAgentId: req.agentId,
      });
    })
    .catch((error) => {
      console.log(error);
      res.sendStatus(500);
    });
  //res.render('index', {currentAgentId: req.agentId});
});

app.use('/conference', conferenceRouter);
app.use('/token', tokenRouter);
app.use('/transfer', transferRouter);
app.use('/action', actionRouter);
app.use('/incoming', incomingRouter);
app.use('/callerid', callerIdRouter);
//app.use('/presence', presenceRouter);
app.use('/login', loginRouter);
app.use('/hold', holdRouter);
//app.use('/accept', acceptRouter);
app.use('/outgoing', outgoingRouter);

var port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Twilio-Firebase listening on port ${port}!`));

module.exports = {
  app
};
