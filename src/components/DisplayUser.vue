<template>
  <div class="container-fluid mt-4">
    <br>
    <p class="h2" align="center"><img :src="require('/Users/pragyaseth/OutOfBandMFA/MGM-OutofBandMFA/src/components/logo2.png')" height="70px" width="100px" align="middle"/>
    User Validation</p><br>
    <div>
      <b-row>
      <b-col md="2">
    </b-col>
    <b-col md="1">
    </b-col>
      <b-col md="6">
        <b-card>
          <b-form inline @submit.prevent="searchUser">
          <b-col>
              <label class="mr-sm-2" for="inline-form-input-name">Employee ID</label>
            </b-col>
            <b-col>
              <b-input v-model="model.employeeID" id="employeeID" class="mb-2 mr-sm-2 mb-sm-0">
              </b-input>
            </b-col>
            <b-col>
               <b-btn type="submit" variant="success" v-b-modal.modal1 width="3">&nbsp; Search &nbsp;</b-btn>
            </b-col>
            <b-col>
               <b-btn type="reset" variant="success" v-on:click="resetForm">&nbsp; Clear &nbsp;</b-btn>
            </b-col>
          </b-form>
        </b-card>
        </b-col>
      </b-row>
  </div>
  <div id="responseMessage" class="text-danger">
    <br>
    <h4 class="h4" align="center">{{ model.responseMessage }}</h4><br>
  </div>
  <b-table stacked :items="model.userData" v-if="clicked"></b-table>
  <div id="enrolledFactors" v-if="factors">
      <br>
      <h3 class="h3" align="left">Enrolled Factors</h3><br>
      <b-row v-if="listContains('push')">
      <b-col md="2"> Okta Verify w/Push
      </b-col>
    <b-col md="2"><b-btn type="submit" variant="success" v-b-modal.modal1 v-on:click="sendPush">Send Push</b-btn>
    </b-col>
      </b-row>
      <br>
      <b-row v-if="listContains('token:software:totp')">
      <b-col md="2"> Okta Verify
      </b-col>
    <b-col md="2">  <b-input id="verifyOTP" class="mb-2 mr-sm-2 mb-sm-0" placeholder="OTP" v-model="model.verifyOTP">
      </b-input>
    </b-col>
      <b-col md="2"><b-btn type="submit" variant="success" v-b-modal.modal1 v-on:click="validateVerifyOTP">Validate OTP</b-btn>
      </b-col>
      </b-row>
      <br>
      <b-row v-if="listContains('sms')">
      <b-col md="2"> SMS
      </b-col>
    <b-col md="2"><b-btn type="submit" variant="success" v-b-modal.modal1 v-on:click="sendSMSOTP">Send OTP</b-btn>
    </b-col>
      <b-col md="2"><b-input id="smsOTP" class="mb-2 mr-sm-2 mb-sm-0" placeholder="OTP" v-model="model.smsOTP">
      </b-input>
      </b-col>
      <b-col md="2"><b-btn type="submit" variant="success" v-b-modal.modal1 v-on:click="validateSMSOTP">Validate OTP</b-btn>
      </b-col>
      </b-row>
      <br>
      <b-row v-if="listContains('call')">
      <b-col md="2"> Voice
      </b-col>
    <b-col md="2"><b-btn type="submit" variant="success" v-b-modal.modal1 v-on:click="sendVoiceOTP">Send OTP</b-btn>
    </b-col>
      <b-col md="2"><b-input id="callOTP" class="mb-2 mr-sm-2 mb-sm-0" placeholder="OTP" v-model="model.callOTP">
      </b-input>
      </b-col>
      <b-col md="2"><b-btn type="submit" variant="success" v-b-modal.modal1 v-on:click="validateVoiceOTP">Validate OTP</b-btn>
      </b-col>
      </b-row>
      <br>
      <b-row v-if="listContains('question')">
      <b-col md="2"> {{ model.question }}
      </b-col>
    <b-col md="2"><b-input id="answer" class="mb-2 mr-sm-2 mb-sm-0" placeholder="Answer" v-model="model.answer">
    </b-input>
    </b-col>
      <b-col md="2"><b-btn type="submit" variant="success" v-b-modal.modal1 v-on:click="validateAnswer">Validate Answer</b-btn>
      </b-col>
      <b-col md="2">
      </b-col>
      </b-row>
  </div>
  </div>
</template>

<script>
import api from '@/api'
export default {
  data () {
    return {
      model: {
        employeeId: '',
        verifyOTP: '',
        smsOTP: '',
        callOTP: '',
        answer: '',
        question: '',
        responseMessage: '',
        factorType: '',
        factorList: [],
        userID: '',
        userData: [
          {first_name: '', last_name: '', email: '', title: '', location: '', DOB: '', accountComment: ''
          }]
      },
      clicked: false,
      factors: false
    }
  },
  methods: {
    async searchUser () {
      console.log('Invoking search user')
      this.model.responseMessage = ''
      if (!this.model.employeeID) {
        this.model.responseMessage = 'Please enter valid employee number.'
      } else {
        var res = await api.searchUser(this.model)
        if (res.errorMessage === 'User Not Found') {
          this.model.responseMessage = res.errorMessage
        } else {
          this.clicked = true
          this.model.userData.pop()
          var data = { first_name: res.profile.firstName,
            last_name: res.profile.lastName,
            email: res.profile.email,
            title: res.profile.title,
            location: res.profile.location,
            DOB: res.profile.dob,
            accountComment: res.profile.accountComment
          }
          this.model.userData.push(data)

          this.model.userID = res.userID
          if (res.errorMessage === 'No MFA Factor Enrolled') {
            this.model.responseMessage = res.errorMessage
          } else {
            this.model.question = res.question
            res.factors.forEach(element => this.model.factorList.push({factorType: element.type, factorID: element.id}))
            this.factors = true
          }
        }
      }
    },
    async sendPush () {
      console.log('Sending push')
      this.model.factorType = 'push'
      var res = await api.validateOTP(this.model.userID, this.model, this.getFactorID('push'))
      console.log(res.message)
      this.model.responseMessage = res.message
      console.log(res.pollURL)
      var endTime = Number(new Date()) + 60000
      var interval = 8000
      var pollRes
      do {
        pollRes = await api.validatePush(res)
        // console.log(pollRes)
        this.wait(interval)
      } while (pollRes !== 'SUCCESS' && new Date() < endTime)

      if (pollRes === 'SUCCESS') {
        this.model.responseMessage = 'Successfully Verified'
      } else {
        this.model.responseMessage = 'Timed Out'
      }
    },
    wait (ms) {
      var start = new Date().getTime()
      var end = start
      while (end < start + ms) {
        end = new Date().getTime()
      }
    },
    async validateVerifyOTP () {
      console.log('Validating Okta Verify OTP')
      this.model.factorType = 'token:software:totp'
      if (this.model.verifyOTP === '') {
        this.model.responseMessage = 'Please enter valid OTP code'
      } else {
        var res = await api.validateOTP(this.model.userID, this.model, this.getFactorID('token:software:totp'))
        // console.log(res)
        this.model.responseMessage = res.message
      }
    },
    async sendSMSOTP () {
      console.log('Sending SMS push')
      this.model.factorType = 'sms'
      this.model.smsOTP = ''
      var res = await api.validateOTP(this.model.userID, this.model, this.getFactorID('sms'))
      // console.log(res)
      this.model.responseMessage = res.message
    },
    async validateSMSOTP () {
      console.log('Validating SMS OTP')
      this.model.factorType = 'sms'
      if (this.model.smsOTP === '') {
        this.model.responseMessage = 'Please enter valid OTP code'
      } else {
        var res = await api.validateOTP(this.model.userID, this.model, this.getFactorID('sms'))
        // console.log(res)
        this.model.responseMessage = res.message
      }
    },
    async sendVoiceOTP () {
      console.log('Sending Voice push')
      this.model.factorType = 'call'
      this.model.callOTP = ''
      var res = await api.validateOTP(this.model.userID, this.model, this.getFactorID('call'))
      // console.log(res)
      this.model.responseMessage = res.message
    },
    async validateVoiceOTP () {
      console.log('Validating Voice OTP')
      this.model.factorType = 'call'
      if (this.model.callOTP === '') {
        this.model.responseMessage = 'Please enter valid OTP code'
      } else {
        var res = await api.validateOTP(this.model.userID, this.model, this.getFactorID('call'))
        // console.log(res)
        this.model.responseMessage = res.message
      }
    },
    async validateAnswer () {
      console.log('Validating Answer')
      this.model.factorType = 'question'
      if (this.model.answer === '') {
        this.model.responseMessage = 'Please enter valid answer for the security question'
      } else {
        var res = await api.validateOTP(this.model.userID, this.model, this.getFactorID('question'))
        // console.log(res)
        this.model.responseMessage = res.message
      }
    },
    listContains (value) {
      var factorListLength = this.model.factorList.length
      for (var i = 0; i < factorListLength; i++) {
        if (this.model.factorList[i].factorType === value) {
          return true
        }
      }
      return false
    },
    getFactorID (value) {
      var factorListLength = this.model.factorList.length
      for (var i = 0; i < factorListLength; i++) {
        if (this.model.factorList[i].factorType === value) {
          return this.model.factorList[i].factorID
        }
      }
      return ''
    },
    resetForm () {
      this.model.employeeId = ''
      this.model.verifyOTP = ''
      this.model.smsOTP = ''
      this.model.callOTP = ''
      this.model.answer = ''
      this.model.question = ''
      this.model.responseMessage = ''
      this.model.factorType = ''
      this.model.factorList = []
      this.model.userData.first_name = ''
      this.model.userData.last_name = ''
      this.model.userData.email = ''
      this.model.userData.title = ''
      this.model.userData.location = ''
      this.model.userData.DOB = ''
      this.model.userData.accountComment = ''
      this.model.userID = ''
      this.clicked = false
      this.factors = false
    }
  }
}
</script>
