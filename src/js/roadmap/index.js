import Awesomplete from 'awesomplete-es6';
import templatize from './template.js';

class CAGovReopening extends window.HTMLElement {
  connectedCallback () {
    let counties = this.dataset.counties;
    let activities = this.dataset.status;
    let activityLabel = 'Activity';
    if(this.dataset.activityLabel) {
      activityLabel = this.dataset.activityLabel;
    }
    let title = 'Find the status for activities in your county';
    if(this.dataset.title) {
      title = this.dataset.title;
    }
    this.seeGuidanceText = 'See guidance for';
    if(this.dataset.seeGuidanceText) {
      this.seeGuidanceText = this.dataset.seeGuidanceText;
    }
    let countyLabel = 'County';
    if(this.dataset.countyLabel) {
      countyLabel = this.dataset.countyLabel;
    }
    let activityPlaceholder = 'Enter a business or activity';
    let countyPlaceholder = 'Enter county' // a ZIP code or
    this.countyRestrictionsAdvice = 'Counties can restrict further.';
    if(this.dataset.countyRestrictions) {
      this.countyRestrictions = this.dataset.countyRestrictions;
    }
    this.industryGuidanceLinkText = 'View industry guidance';
    if(this.dataset.industryGuidance) {
      this.industryGuidanceLinkText = this.dataset.industryGuidance;
    }
    this.viewall = 'View all';
    if(this.dataset.viewAll) {
      this.viewall = this.dataset.viewAll;
    }
    this.state = {};

    this.innerHTML = templatize(title, countyLabel, countyPlaceholder, activityLabel, activityPlaceholder);
    let theMatrix = document.querySelector('.the-matrix');
    if(theMatrix) {
      document.querySelector('.matrix-holder').innerHTML = theMatrix.innerHTML;
    }

    window.fetch('/countystatus.json')
    .then(response => response.json())
    .then(function(data) {
      this.countyStatuses = data;
      let aList = [];
      this.countyStatuses.forEach(c => { aList.push(c.county) })
      this.setupAutoComp('#location-query', 'county', aList);
    }.bind(this));

    window.fetch('/statusdescriptors.json')
    .then(response => response.json())
    .then(function(data) {
      this.statusdesc = data;
    }.bind(this));

    window.fetch('/schools-may-reopen.json')
    .then(response => response.json())
    .then(function(data) {
      this.schoolOKList = data;
    }.bind(this));

    window.fetch('/reopening-activities.json')
    .then(response => response.json())
    .then(function(data) {
      this.allActivities = data.Table1;
      let aList = []
      // aList.push(this.viewall);
      data.Table1.forEach(item => {
        aList.push(item['0'])
      })
      this.setupAutoCompActivity('#activity-query', 'activity', aList)
      document.querySelector('.reopening-tableau-embed').innerHTML = `<div class='tableauPlaceholder' style='width: 920px; height: 527px;'><object class='tableauViz' width='920' height='527' style='display:none;'><param name='host_url' value='https%3A%2F%2Ftableau.cdt.ca.gov%2F' /> <param name='embed_code_version' value='3' /> <param name='site_root' value='' /><param name='name' value='COVID-19PlanforreducingCOVID-19webpage_16031507318480&#47;planforreducingcovid-19' /><param name='tabs' value='no' /><param name='toolbar' value='yes' /><param name='showAppBanner' value='false' /></object></div>`;
      this.tableauStuff()
    }.bind(this))
    .catch(() => {
      //resetForm();
    });

    document.querySelector('.reopening-activities').addEventListener('submit',function(event) {
      event.preventDefault();
      if(document.querySelector('#location-query').value == '') {
        this.state['county'] = null;
      }
      if(document.querySelector('#activity-query').value == '') {
        this.state['activity'] = null;
      }
      if(!this.state['activity'] && !this.state['county']) {
        this.querySelector('.card-holder').innerHTML = '';
      } else {
        this.layoutCards();
      }
    }.bind(this))
  }

  setupAutoComp(fieldSelector, fieldName, aList) {
    let component = this;
    const awesompleteSettings = {
      autoFirst: true,
      filter: function (text, input) {
        return Awesomplete.FILTER_CONTAINS(text, input.match(/[^,]*$/)[0]);
      },
      item: function (text, input) {
        return Awesomplete.ITEM(text, input.match(/[^,]*$/)[0]);
      },
      replace: function (text) {
        let before = this.input.value.match(/^.+,\s*|/)[0];
        let finalval = before + text;
        this.input.value = finalval;
        component.state[fieldName] = finalval;
        // component.layoutCards();
      },
      list: aList
    };


    const aplete = new Awesomplete(fieldSelector, awesompleteSettings)
  }

  tableauStuff() {
    var divElement = document.querySelector('.tableauPlaceholder');
    var vizElement = divElement.getElementsByTagName('object')[0];
    if ( divElement.offsetWidth > 921 ) { vizElement.style.width='920px';vizElement.style.height='547px';} 
    else if ( (divElement.offsetWidth > 910) && (divElement.offsetWidth < 920)) { vizElement.style.width='900px';vizElement.style.height='547px';} 
    else if ( (divElement.offsetWidth > 700) && (divElement.offsetWidth < 899) ) { vizElement.style.width='700px';vizElement.style.height='547px';} 
    else { vizElement.style.width='100%';vizElement.style.height='627px';}
    var scriptElement = document.createElement('script');
    // scriptElement.src = 'https://public.tableau.com/javascripts/api/viz_v1.js';
    scriptElement.src = 'https://tableau.cdt.ca.gov/javascripts/api/viz_v1.js';
    vizElement.parentNode.insertBefore(scriptElement, vizElement);
  }
  setupAutoCompActivity(fieldSelector, fieldName, aList) {
    let component = this;
    const awesompleteSettings = {
      autoFirst: true,
      minChars: 0,
      maxItems: 99,
      sort: function(a,b) {
        if(a['0'] < b['0']) {
          return -1;
        }
        if(a['0'] > b['0']) {
          return 1;
        }
        return 0;
      },
      replace: function (text) {
        let before = this.input.value.match(/^.+,\s*|/)[0];
        let finalval = before + text;
        this.input.value = finalval;
        component.state[fieldName] = finalval;
        component.layoutCards();
        document.querySelector(fieldSelector).blur();
      },
      list: aList
    };

    window.aplete2 = new Awesomplete(fieldSelector, awesompleteSettings);
    document.querySelector(fieldSelector).addEventListener('focus', function() {
      this.value = '';
      window.aplete2.evaluate();
    })
  }

  layoutCards() {
    let replaceAllInMap = function(str){
      let mapObj = {
        '&lt;': '<',
        '&gt;': '>',
        '’': '"',
        '”': '"'
      }
      var re = new RegExp(Object.keys(mapObj).join("|"),"gi");
      return str.replace(re, function(matched){
        return mapObj[matched.toLowerCase()];
      });
    }
    this.cardHTML = '';
    let selectedCounties = this.countyStatuses;
    if(this.state['county']) {
      selectedCounties = [];
      this.countyStatuses.forEach(item => {
        if(item.county == this.state['county']) {
          selectedCounties.push(item)
        }
      })
    }
    // if we are in one of these counties schools can reopen:
    let schoolOKList = [
      "Alameda",
      "Alpine",
      "Amador",
      "Butte",
      "Calaveras",
      "Contra Costa",
      "Del Norte",
      "El Dorado",
      "Fresno",
      "Humboldt",
      "Inyo",
      "Lake",
      "Lassen",
      "Marin",
      "Mariposa",
      "Modoc",
      "Mono",
      "Napa",
      "Nevada",
      "Orange",
      "Placer",
      "Plumas",
      "Riverside",
      "Sacramento",
      "San Diego",
      "San Francisco",
      "San Joaquin",
      "San Luis Obispo",
      "San Mateo",
      "Santa Barbara",
      "Santa Clara",
      "Santa Cruz",
      "Sierra",
      "Siskiyou",
      "Solano",
      "Trinity",
      "Tuolumne",
      "Yolo"
    ];
    if(this.schoolOKList) {
      schoolOKList = this.schoolOKList;
    }
    let schoolShenanigans = function(county) {
      const schoolFooter = `<p>See <a href="https://covid19.ca.gov/industry-guidance/#schools-guidance">schools guidance</a>, <a href="https://www.cdph.ca.gov/Programs/CID/DCDC/Pages/COVID-19/Schools-FAQ.aspx">schools FAQ</a>, and <a href="https://files.covid19.ca.gov/pdf/guidance-schools-cohort-FAQ.pdf">cohorting FAQs</a>.`;

      if(schoolOKList.indexOf(county) > -1) {
        return 'Schools may reopen fully for in-person instruction. Local school officials will decide whether and when that will occur.'
        + schoolFooter;
      }
      return /*html*/`Schools may not reopen fully for in-person instruction until the county has been in the Substantial (Red) Tier for two weeks. Local school and health officials <a href="https://www.cdph.ca.gov/Programs/CID/DCDC/Pages/COVID-19/In-Person-Elementary-Waiver-Process.aspx">may decide to open elementary schools</a>, and school officials <a href="https://www.cdph.ca.gov/Programs/CID/DCDC/Pages/COVID-19/Schools-FAQ.aspx">may decide to conduct in-person instruction</a> for a limited set of students in small cohorts.</p>
      <p>Note on exception: Schools that have already re-opened if the county was in a less restrictive tier do not have to close. However, if a school had not already reopened for in-person instruction, it may not reopen until the county moves back to the Substantial (Red) Tier for 14 days.</p>
      `
      + schoolFooter;
    }
    let selectedActivities = this.allActivities;
    selectedCounties.forEach(item => {
      this.cardHTML += `<h2 class="text-black mb-0">${item.county} County</h2><div class="county-container"><div class="card-county county-color-${item['Overall Status']}">
        
        <div class="pill">${this.statusdesc.Table1[parseInt(item['Overall Status']) - 1]['County tier']}</div>
        <p>${this.statusdesc.Table1[parseInt(item['Overall Status']) - 1].description}. <a href="#county-status">Understand the data.</a></p>
      </div></div><p class="mt-0">${this.countyRestrictionsAdvice} Check your <a href="/get-local-information/#County-websites">county's website</a>.</p>`
      if(this.state['activity']) {
        selectedActivities = [];
        this.allActivities.forEach(ac => {
          if(ac["0"] == this.state['activity'] || this.state['activity'] == this.viewall) {
            selectedActivities.push(ac);
          }
        })
      }
      selectedActivities.forEach(ac => {
        this.cardHTML += `<div class="card-activity">
          <h4>${ac["0"]}</h4>
          <p>${ac["0"] === "Schools" ? schoolShenanigans(item.county) : ac[item['Overall Status']]}</p>
          <p>${ac["0"] === "Schools" ? "" : ac["5"].indexOf('href') > -1 ? `${this.seeGuidanceText} ${replaceAllInMap(ac["5"])}` : ""}</p>
        </div>`
      })
    })
    // These classes are used but created with variables so the purge cannot find them, they are carefully placed here where they will be noticed
    this.cardHTML += `<div style="display:none">
      <div class="county-color-1 county-color-2 county-color-3 county-color-4 text-black"></div>
    </div>`
    this.querySelector('.card-holder').innerHTML = `<div class="card-content">${this.cardHTML}</div>`;
    this.querySelector('.card-holder').classList.remove('inactive');

    // Dispatch custom event so we can pick up and track this usage elsewhere.
    const event = new window.CustomEvent('safer-economy-page-submission', {
      detail: {
        county: this.state.county,
        activity: this.state.activity
      }
    });
    window.dispatchEvent(event);
  }
}
window.customElements.define('cagov-reopening', CAGovReopening);


var activityInput = document.getElementById("activity-query");
var countyInput = document.getElementById("location-query");



// Show clear btn only on input (County)
countyInput.addEventListener("input", function() {
  inputValueCounty();
 });

// Show clear btn only on input (Activity)
activityInput.addEventListener("input", function() {
  inputValueActivity();
 });

 activityInput.addEventListener("blur", function() {
  inputValueActivity();
 });


//Clear buttons click events
document.getElementById("clearLocation").addEventListener("click", function() {
  countyInput.value = '';
  inputValueCounty();
});

document.getElementById("clearActivity").addEventListener("click", function() {
  activityInput.value = '';
  inputValueActivity();
});

// Show clear btn only if there is value (County)
function inputValueCounty() {
  var countyInput = document.getElementById("location-query");
  var clearCounty = document.getElementById("clearLocation");
    if (countyInput && countyInput.value) {
      clearCounty.classList.remove('d-none');
    }
    else {clearCounty.classList.add('d-none');}
  }

// Show clear btn only if there is value (Activity)
function inputValueActivity() {
  var activityInput = document.getElementById("activity-query");
  var clearActivity = document.getElementById("clearActivity");
    if (activityInput && activityInput.value) {
      clearActivity.classList.remove('d-none');
    }
    else {clearActivity.classList.add('d-none');}
  }
