const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const OktaJwtVerifier = require('@okta/jwt-verifier')

// create a custom timestamp format for log statements
const SimpleNodeLogger = require('simple-node-logger'),
    opts = {
        logFilePath:'mylogfile.log',
        timestampFormat:'YYYY-MM-DD HH:mm:ss.SSS'
    },
log = SimpleNodeLogger.createSimpleLogger( opts );
log.setLevel('info');


const orgURL = 'https://seth.oktapreview.com'
const sswsToken = '00Lj2i5RPOR_YdJEgkAlE8HY48a_BhVNxSVLtc5M03'
const client = '0oaptfdmjzFlIsCEN0h7'
const host = 'http://localhost'
const port = '8081'


const hostURL = host + ':' + port

const searchUserURL = orgURL + '/api/v1/users/'
const axios = require('axios')
var userID
var status



const oktaJwtVerifier = new OktaJwtVerifier({
  clientId: client,
  issuer: orgURL + '/oauth2/default'
})

let app = express()
app.use(cors())
app.use(bodyParser.json())


// verify JWT token middleware

app.use((req, res, next) => {
  // require every request to have an authorization header
  if (!req.headers.authorization) {
    return next(new Error('Authorization header is required'))
  }
  let parts = req.headers.authorization.trim().split(' ')
  let accessToken = parts.pop()
  oktaJwtVerifier.verifyAccessToken(accessToken)
    .then(jwt => {
      req.user = {
        uid: jwt.claims.uid,
        email: jwt.claims.sub
      }
      userID = jwt.claims.uid
      next()
    })
    .catch(next) // jwt did not verify!
})

app.post('/:userid/factors/:factorid/verify', async function(req, res){
  const verifyUserURL = searchUserURL + req.params.userid + "/factors/" + req.params.factorid + "/verify"

  log.debug("Verify user url:" + verifyUserURL)

 let reqBody = `{}`

  if(req.body.factorType == 'sms' && req.body.smsOTP) {
      reqBody = `{"passCode": "${req.body.smsOTP}"}`
  }
  else if(req.body.factorType == 'call' && req.body.callOTP) {
      reqBody = `{"passCode": "${req.body.callOTP}"}`
  }
  else if(req.body.factorType == 'token:software:totp' && req.body.verifyOTP) {
      reqBody = `{"passCode": "${req.body.verifyOTP}"}`
  } else if(req.body.factorType== 'question' && req.body.answer) {
      reqBody = `{"answer": "${req.body.answer}"}`
  }

  let result = {
    pollURL: '',
    message: ''
  }

  await axios.post(verifyUserURL, reqBody, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `SSWS ${sswsToken}`,
          'Access-Control-Allow-Origin': `${hostURL}`
          }
        }).then(async function(response){

          log.debug(response.data)
          if(reqBody === "{}") {
            result.message = "OTP Sent"
            if(req.body.factorType == 'push') {
              result.pollURL = response.data._links.poll.href

              log.debug("poll url" + result.pollURL)
            }
          } else {
            result.message = "Successfully Verified"
          }

        }).catch((error) => {
          if(error.message.includes("403")) {
            result.message = "Not Validated"
          } else if(error.message.includes("429")) {
            result.message = "Too many retries"
          }else {
            result.message = error.message
          }
          log.info("Verify user error is: " + result.message)
        })
      res.send(result)
})

app.get('/searchUser/:id', async function(req, res){

 const searchUser = searchUserURL + req.params.id;

let result = {
  profile: {
    firstName: '',
    lastName: '',
    email: '',
    title: '',
    location: '',
    dob: '',
    accountComment: ''
  },
  factors: [],
  userID: '',
  question: '',
  errorCode: '',
  errorMessage: ''
}
  await axios.get(searchUser, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `SSWS ${sswsToken}`,
          'Access-Control-Allow-Origin': `${hostURL}`
          }
        }).then(async function(response){

          result.profile.firstName = response.data.profile.firstName;
          result.profile.lastName = response.data.profile.lastName;
          result.profile.email = response.data.profile.email;
          result.profile.title = response.data.profile.title;
          result.profile.location = response.data.profile.location;
          result.profile.dob = response.data.profile.dob;
          result.profile.accountComment = response.data.profile.accountComment;
          result.userID = response.data.id;

          const searchEnrolledFactors = searchUserURL + response.data.id + "/factors";

          await axios.get(searchEnrolledFactors, {headers: {
                                        'Accept': 'application/json',
                                        'Content-Type': 'application/json',
                                        'Authorization': `SSWS ${sswsToken}`,
                                        'Access-Control-Allow-Origin': `${hostURL}`
                                      }}).then((res) => {

                                       var factorList = res.data;

                                       if(factorList.length == 0) {
                                           result.errorMessage = "No MFA Factor Enrolled"
                                       }

                                       for (i = 0; i < factorList.length; i++) {

                                          let factor = {
                                              type: '',
                                              id: '',
                                         }
                                         factor.type = factorList[i].factorType;
                                         factor.id = factorList[i].id;
                                         result.factors.push(factor);
                                        log.debug(result.factors);
                                         if(factor.type == 'question') {
                                            result.question = factorList[i].profile.questionText
                                         }
                                       }
                                       log.info(result);
                                       // get status text
                                       // status = res.statusText

                                     }).catch((error) => {
                                         status = error
                                         log.info("Enrolled factor error: " + status)
                                       })
          log.debug(result)

        }).catch((error) => {
            if(error.message.includes("404")) {
              result.errorMessage = "User Not Found"
            } else {
              result.errorMessage = error.message
            }
            log.info("Search user error is: " + result.errorMessage)
        })
    res.send(result)
})

app.post('/validatePush', async function(req, res){

  const verifyPushURL = req.body.pollURL
  log.debug(verifyPushURL)
  let result
  await axios.get(verifyPushURL, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `SSWS ${sswsToken}`,
          'Access-Control-Allow-Origin': `${hostURL}`
          }
        }).then(async function(response){
             result = response.data.factorResult

        }).catch((error) => {
              result = error.message
        })
  res.send(result)
})


//launches the app on :8081
app.listen(port, () => {
  log.info('listening to ' + hostURL)
})
