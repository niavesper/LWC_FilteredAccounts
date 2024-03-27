/**
 * @fileoverview This JS is part of the LWC filterAccountByBusinessCategory that provides functionality to filter
 * Salesforce Account records by business category, county, and search key. The LWC lives on the Experience Cloud site
 * Business Registrations (https://vbr.veterans.utah.gov/s/) and is used by the public to search for registered
 * veteran-owned businesses in Utah. The LWC is used in conjunction with the Apex class GetAccountsByBusinessCategory.
 * @author niavesper
 * @date 03/26/2024
 * @version 1.0
 */

import { LightningElement, wire, track } from "lwc";
// Import the getObjectInfo and getPicklistValues functions from the UI API module
import { getObjectInfo } from "lightning/uiObjectInfoApi";
import { getPicklistValues } from "lightning/uiObjectInfoApi";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import filterAccounts from "@salesforce/apex/GetAccountsByBusinessCategory.filterAccounts";
import ACCOUNT_OBJECT from "@salesforce/schema/Account";
import BUSINESS_CATEGORY from "@salesforce/schema/Account.Business_Category__c";
import COUNTY from "@salesforce/schema/Account.COUNTY__c";
// Import the NavigationMixin to allow navigation to the record page.
// NavigationMixin is a higher-order class that is used in LWC
// to add page navigation functionality.
import { NavigationMixin } from "lightning/navigation";

// By extending NavigationMixin, this class gains the ability
// to navigate to other pages in Salesforce.
// LightningElement is the base class for creating Lightning Web Components in Salesforce,
// and it provides the core functionality and lifecycle hooks for components.
export default class FilterAccountByBusinessCategory extends NavigationMixin(LightningElement) {
  searchKey = '';
  newOptions; // array of options for picklists
  businessCategories = []; // Stores values from the "Business Categories" picklist
  counties = []; // Stores values from the "Counties" picklist
  data = []; 
  @track accounts; // Stores account query result returned from an Apex method
  businessCategoryOptions; // Stores the picklist values for the "Business Categories" field
  countyOptions; // Stores the picklist values for the "Counties" field
  hasRendered = false; // Flag to check if the component has rendered

  // Used to retrieve metadata about the Account object from Salesforce.
  @wire(getObjectInfo, { objectApiName: ACCOUNT_OBJECT })
  objectInfo;

  // Getter method to get the record type Id for the "Business Registration" record type
  get recordTypeId() {
    // Constant that holds an object that maps record type IDs to their corresponding record type info. 
    const rtis = this.objectInfo.data.recordTypeInfos;
    // Returns the record type Id for the "Business Registration" record type
    return Object.keys(rtis).find(
      (rti) => rtis[rti].name === "Business Registration"
    );
  }
  
  /**
   * @method businessCategoryPicklistOptions
   * @param {object} param0 - The response object containing error and data
   * @description Retrieves the picklist values for the Business Category field
   * @returns {object} - The picklist values for the Business Category field
   */
  @wire(getPicklistValues, {
    recordTypeId: "$recordTypeId",
    fieldApiName: BUSINESS_CATEGORY
  })
  businessCategoryPicklistOptions({ error, data }) {
    if (data) {
      this.businessCategoryOptions = data.values;
      let newOptions = [];
      let defaultVal = [];

      // Loop through the picklist values and create options
      for (let i = 0, l = this.businessCategoryOptions.length; i < l; i++) {
        let option = {};
        option.label = this.businessCategoryOptions[i].label;
        option.value = this.businessCategoryOptions[i].value;
        defaultVal.push(option.value);
        newOptions.push(option);
      }
      this.businessCategoryOptions = newOptions;
    } else if (error) {
      // Display an error toast if business categories don't load
      this.dispatchEvent(
        new ShowToastEvent({
          title: 'Error loading business category options',
          message: error.body.message,
          variant: 'error',
        }),
      );
    }
  }

  /**
   * @method countyPicklistOptions
   * @param {object} param0 - The response object containing error and data
   * @description Retrieves the picklist values for the County field
   */ 
  @wire(getPicklistValues, {
    recordTypeId: "$recordTypeId",
    fieldApiName: COUNTY
  })
  countyPicklistOptions({ error, data }) {
    if (data) {
      this.countyOptions = data.values;
      let newOptions = [];
      let defaultVal = [];

      // Loop through the picklist values and create options
      for (let i = 0, l = this.countyOptions.length; i < l; i++) {
        let option = {};
        option.label = this.countyOptions[i].label;
        option.value = this.countyOptions[i].value;
        defaultVal.push(option.value);
        newOptions.push(option);
      }
      this.countyOptions = newOptions;
    } else if (error) {
      // Display an error toast if counties don't load
      this.dispatchEvent(
        new ShowToastEvent({
          title: 'Error loading county options',
          message: error.body.message,
          variant: 'error',
        }),
      );
    }
  }

  /**
   * @method callFilterAccounts
   * @description Calls the filterAccounts Apex method to filter 
   * accounts based on the search key, business categories, and counties.
   * If the method is successful, it assigns the result to the accounts property.
   * If the method fails, it displays an error toast.
   */
  callFilterAccounts() {
    filterAccounts({
      searchkey: this.searchKey,
      filterBusinessCategories: this.businessCategories,
      filterCounties: this.counties
    })
      .then((result) => {
        this.accounts = result;
      })
      .catch((error) => {
        // Display an error toast if the filter cannot be applied
        this.dispatchEvent(
          new ShowToastEvent({
            title: "Unable to apply filter",
            message: error.body.message,
            variant: "error"
          })
        );
      });
  }

  /**
   * @method renderedCallback
   * @description Callback function that is called after the component is rendered
   * If the component has not been rendered before, it calls the filterAccounts method.
   */
  renderedCallback() {
    if (this.hasRendered === false) {
      this.callFilterAccounts();
      this.hasRendered = true;
    }
  }

  /**
   * @method handleFilterChange
   * @param {object} event - The event object containing the filter change information
   * @description Handles the change event of the filter inputs
   */
  handleFilterChange(event) {
    if (event.target.dataset.type === "searchBar") {
      this.searchKey = event.target.value;
    } else if (event.target.dataset.type === "businessCategoryFilter") {
      this.businessCategories = event.detail.value;
    } else if (event.target.dataset.type === "countyFilter") {
      this.counties = event.detail.value;
    }

    this.callFilterAccounts();
  }

  /**
   * @method navigateToAccount
   * @param {object} event - The event object
   * @description Navigates to the selected account record page
   */
  navigateToAccount(event) {
    this[NavigationMixin.Navigate]({
      type: "standard__recordPage",
      attributes: {
        recordId: event.target.dataset.type,
        objectApiName: ACCOUNT_OBJECT.objectApiName,
        actionName: "view"
      }
    });
  }

  /** 
   * @method refreshData
   * @description Refreshes the data by calling the callFilterAccounts method
   */
  refreshData() {
    this.callFilterAccounts();
  }

  /**
   * @method selectAll  
   * @param {object} event - The event object
   * @description Selects all the options in the picklist
   */
  selectAll(event) {
    const type = event.target.dataset.type;

    if (type === "businessCategories") {
      this.businessCategories = this.businessCategoryOptions.map(
        (option) => option.value
      );
    } else if (type === "counties") {
      this.counties = this.countyOptions.map((option) => option.value);
    }

    // Call the refreshData method to refresh the data
    this.refreshData();
  }


  /**
   * @method clearAll
   * @param {object} event - The event object
   * @description Clears all the selected options in the picklist 
   */
  clearAll(event) {
    const type = event.target.dataset.type;

    if (type === "businessCategories") {
      this.businessCategories = [];
    } else if (type === "counties") {
      this.counties = [];
    }

    // Call the refreshData method to refresh the data
    this.refreshData();
  }
}


