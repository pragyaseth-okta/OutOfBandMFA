<template>
  <div class="hero">
    <div>
      <img :src="require('/Users/pragyaseth/OutOfBandMFA/MGM-OutofBandMFA/src/components/logo.png')" style="width:500px;height:100px;"/>
      <br><br>
      <h1 class="display-3">MFA for User Validation</h1>
      <p class="lead">Please sign in to access this app</p>
    </div>
  </div>
</template>

<style>
  .hero {
    height: 90vh;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
  }
  .hero .lead {
    font-weight: 200;
    font-size: 1.5rem;
  }
</style>
