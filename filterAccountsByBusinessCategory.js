import { LightningElement, wire, track} from "lwc";
import { getPicklistValues } from "lightning/uiObjectInfoApi";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import filterAccounts from "@salesforce/apex/getAccountsByBusinessCategory.filterAccounts";
import getBusinessCategoryPicklistValues from '@salesforce/apex/getAccountsByBusinessCategory.getBusinessCategoryPicklistValues';
import ACCOUNT_OBJECT from "@salesforce/schema/Account";
import COUNTY from "@salesforce/schema/Account.COUNTY__c";
import { NavigationMixin } from "lightning/navigation";

export default class FilterAccountByBusinessCategory extends NavigationMixin(
  LightningElement
) {
  searchKey;
  showData = false;
  newOptions;
  businessCategories = [];
  counties = [];
  data = [];
  @track accounts;
  defaultValues = [];
  options;
  countyOptions;
  hasRendered = false;

  /**
   * @method businessCategoryOptions
   * @param {object} param0 - The response object containing error and data
   * @description Retrieves the picklist values for the accountidcategory field
   */

  @wire(getBusinessCategoryPicklistValues)
  businessCategoryOptions({ error, data }) {
      console.log("data", JSON.stringify(data));
      console.log("error", JSON.stringify(error));
      if (data) {
      this.options = data.values;
      let newOptions = [];
      let defaultVal = [];

      // Loop through the picklist values and create options
      for (let i = 0, l = this.options.length; i < l; i++) {
        let option = {};
        option.label = this.options[i].label;
        option.value = this.options[i].value;
        defaultVal.push(option.value);
        newOptions.push(option);
      }
      this.options = newOptions;
      this.defaultValues = defaultVal;
    } else if (error) {
      this.error = error;
      this.data = undefined;
    }
  }

  @wire(getPicklistValues, {
    recordTypeId: "01235000000GHVcAAO",
    fieldApiName: COUNTY
  })
  countyPicklistOptions({ error, data }) {
    console.log("data", JSON.stringify(data));
    console.log("error", JSON.stringify(error));
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
      this.defaultValues = defaultVal;
    } else if (error) {
      this.error = error;
      this.data = undefined;
    }
  }

  /**
   * @method renderedCallback
   * @description Callback function that is called after the component is rendered
   */
  renderedCallback() {
    if (this.hasRendered === false) {
      // Call the filterAccounts Apex method to retrieve the filtered accounts
      filterAccounts({
        filterCategories: this.businessCategories,
        filterCounties: this.counties,
        searchkey: this.searchKey
      })
        .then((result) => {
          this.accounts = result;
          this.showData = true;
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
    } else if (event.target.dataset.type === "filter") {
      this.businessCategories = event.detail.value;
    } else if (event.target.dataset.type === "countyFilter") {
      this.counties = event.detail.value;
    }

    // Call the filterAccounts Apex method with the updated search key and filter areas
    filterAccounts({
      searchkey: this.searchKey,
      filterCategories: this.businessCategories,
      filterCounties: this.counties
    })
      .then((result) => {
        this.accounts = result;
        this.showData = true;
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

  refreshData() {
    // Call the filterAccounts Apex method with the updated search key and filter areas
    filterAccounts({
      searchkey: this.searchKey,
      filterCategories: this.businessCategories,
      filterCounties: this.counties
    })
      .then((result) => {
        this.accounts = result;
        this.showData = true;
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

  selectAll(event) {
    const type = event.target.dataset.type;

    if (type === "businessCategories") {
      this.businessCategories = this.options.map((option) => option.value);
    } else if (type === "counties") {
      this.counties = this.countyOptions.map((option) => option.value);
    }

    // Call the refreshData method to refresh the data
    this.refreshData();
  }

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

