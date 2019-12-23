#!/usr/bin/env node

const http_request = require("request");
const storage = require('node-persist');

const nodeListURL = "https://map.ffrn.de/data/meshviewer.json"; // URL where we gett the current nodes status
const ZIP = "69256"; // German Postleitzahl to use for localization of GrünstromIndex

const co2_grey = 0.482;     // gramm co2 per Wh (standard)
const co2_green = 0.035;     // gramm co2 per Wh (green energy)

/**
 * Use Freifunk Map Endpoint to get a list of current online nodes
 */
const retrieveCurrentyNodeList = function() {
  return new Promise(async function (resolve, reject)  {
      http_request(nodeListURL,function(e,r,b) {
        try {
          let json = JSON.parse(b);
          resolve(json.nodes);
        } catch(e) {
          reject("Unable to retrieve and parse nodelist from url "+nodeListUrl+" "+e);
        }
      });
  });
}

/**
 * Calculates the current Power (Watt) - we use this as base to calculate Consumption (Watthours)
 *  - Iterate the node list and add active nodes
 *  - Each active node we put a base power of 5 Watt
 *  - For each connected user we add another Watt (handling)
 *
 *  In future releases we might destinguish between different hardware - or do some other nice stuff
 **/
const calculateCurrentPower = function(active_nodes) {
  return new Promise(async function (resolve, reject)  {
        let total_power = 0;
        for(let i=0; i<active_nodes.length ; i++) {
          if(active_nodes[i].is_online == true) {
            total_power += 5; // 5 Watt as base power usage
            total_power += (active_nodes[i].clients * 1) // 1 Watt per Client connected
          }
        }
        resolve(total_power); // resolves the total actual power in Watt
  });
}

/**
 * Use Corrently API to create/maintain a virtual meter for this instance
 * We just need to push the latest power and the API endpoint will care about
 * all calculations in the background.
 * To avoid a key handling we use a generated meterid + secret to confirm updates
 **/
const storeConsumption = function(current_power,meterid,metersecret) {
  return new Promise(async function (resolve, reject)  {
      let readingdata = {
        power:current_power,
        zip:ZIP,
        externalAccount:meterid,
        secret:metersecret
      };

      http_request.post("https://api.corrently.io/core/reading",{form:readingdata},function(e,r,b) {
        try {
          let json = JSON.parse(b);
          resolve(json);
        } catch(e) {
          reject("Unable to store reading "+e);
        }
      });
  });
}

/**
 * Trigger Corrently API update of CO2 emission calculation
 **/
const calculateCO2 = function(account) {
  return new Promise(async function (resolve, reject)  {
      // We let Corrently API handle the CO2 Calculation
      http_request.get("https://api.corrently.io/core/emission?account="+account,function(e,r,b) {
        try {
          let json = JSON.parse(b);
          resolve(json);
        } catch(e) {
          reject("Unable to retrieve co2 calculation "+e);
        }
      });
  });
}

const main = function() {
  return new Promise(async function (resolve, reject)  {

    // Manage local meter instance
    await storage.init();
    let meterid = await storage.getItem("meterid");
    let metersecret = await storage.getItem("metersecret");
    if(typeof meterid == "undefined") {                   //if we do not have a meterid for this instance - we create a new one and persist it localy
      meterid = "freifunk_rrnk"+new Date().getTime();
      await storage.setItem("meterid",meterid);
      metersecret = Math.random()*new Date().getTime();   // this is not the best random secret generator, but should do for this purpose
      await storage.setItem("metersecret",metersecret);
    }
    console.log("Meter Id",meterid);

    // Calculation of Energy Consumption
    let current_power = await calculateCurrentPower(await retrieveCurrentyNodeList());
    console.log("Current Power Load (kW):",(current_power/1000));

    // Blockchain Operation for Virtual Meter
    let oracle = await storeConsumption(current_power,meterid,metersecret);   // Use Corrently Blockchain Oracle to store and persist virtual Meter reading
    console.log("Total Consumption/Meter Reading (kWh):",oracle["1.8.0"]/1000);
    console.log("Immutable URL of virtual meter reading:","https://api.corrently.io/core/reading?account="+oracle.account);
    console.log("Immutable URL for CO2 comission of virtual meter","https://api.corrently.io/core/emission?account="+oracle.account)
    // Do CO2 Footprint Calculation
    let co2calculation = await calculateCO2(oracle.account);
    console.log("Total CO2 emission (kg)",(co2calculation.co2/1000));
    console.log("Compensated CO2 (kg)",co2calculation.compensation.base_haben/1000);
    console.log("Waiting for Compensation (kg)",(co2calculation.compensation.balance_base/-1000));
    resolve();
  });
}

main();
