/** @odoo-module **/
import { registry } from '@web/core/registry';
const { Component, useState, onWillStart } = owl;
import { useService } from "@web/core/utils/hooks";
import { hooks } from '@odoo/owl';
import { useModel } from '@odoo/owl';

export class GetExcelData extends Component {
  setup() {
    this.orm = useService("orm");
    this.state = useState({
      fieldNames: [], // All required fields/columns and their names as well
      excelData: [],
      fields: {},
      orderData: [],
      alignedOrderData: [],
      ppLotDuplicateValue: [],
      classifications: [],
    });
    onWillStart(async () => {
        const fields = await this.fetchModelFields();
                    // Unwanted fields
        const excludedFields = ['message_main_attachment_id', 'create_uid', 'write_uid', 'create_date', 'write_date', 'activity_date_deadline', 'activity_exception_decoration', 'activity_exception_icon', 'activity_ids', 'activity_state', 'activity_summary', 'activity_type_icon', 'activity_type_id', 'activity_user_id', "my_activity_date_deadline", "message_is_follower", "message_follower_ids",
                                "message_follower_ids", "message_partner_ids","message_ids","has_message","message_needaction","message_needaction_counter","message_has_error","message_has_error_counter", "message_attachment_count", "message_has_sms_error", "website_message_ids", "__last_update", "display_name" ];
        const filteredFields = Object.keys(this.state.fields)
            .filter(fieldName => !excludedFields.includes(fieldName))
            .map(fieldName => ({
                name: fieldName,
                actualName: this.state.fields[fieldName].string,
            }));
        this.state.fieldNames = filteredFields;

        const orderData = await this.fetchOrderData();
        this.state.orderData = orderData;

        const alignedOrderData = this.alignOrderDataByClassificationType(orderData);
        this.state.alignedOrderData = alignedOrderData;

        this.fetchClassificationNames();


    });
    this.state.notification =useService("notification");
    this.handleFileUpload = this.handleFileUpload.bind(this);
    this.changeExcelData = this.changeExcelData.bind(this);
    this.upload_data = this.upload_data.bind(this);
    this.fetchClassificationNames = this.fetchClassificationNames.bind(this);

  }

fetchClassificationNames() {
  this.orm
    .searchRead('order.classification', [], ['classification_name'])
    .then((result) => {
      if (result && result.length > 0) {
        this.state.classifications = result.map((record) => record.classification_name);
        console.log('Classification names fetched successfully:', this.state.classifications);
      } else {
        console.error('No records found in the result:', result);
      }
    })
    .catch((error) => {
      console.error('Error fetching classification names:', error);
    });
}





//    fetchClassificationNames() {
//      this.orm
//        .searchRead('order.classification', [], ['classification_name'])
//        .then((result) => {
//          if (result && result.length > 0) {
//            console.log('Classification names fetched successfully:', result);
//          } else {
//            console.error('No records found in the result:', result);
//          }
//        })
//        .catch((error) => {
//          console.error('Error fetching classification names:', error);
//        });
//    }




      alignOrderDataByClassificationType(orderData) {
        const alignedData = {};
        for (const order of orderData) {
            if (order.status === 'PPC Manager') { // Filter orders by status
                const classification_name = order.classification_name;
                if (!alignedData.hasOwnProperty(classification_name)) {
                    alignedData[classification_name] = [];
                }
                alignedData[classification_name].push(order);
            }
        }
        // Sort the orders within each classification_name group based on sequence
        for (const key in alignedData) {
            alignedData[key].sort((a, b) => a.sequence - b.sequence);
        }
        return Object.entries(alignedData).map(([key, value]) => ({ key, value }));
    }


        async fetchModelFields() {
        const response = await fetch('/api/ppc_order_view/get_model_fields', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const result = await response.json();
        return result.fields;
    }
    async fetchOrderData() {
        const fieldNames = this.state.fieldNames.map(field => field.name);
        const orderData = await this.orm.searchRead('order.data', [], fieldNames);
        return orderData;
    }

    generateRandomNumber() {
        const randomNum = Math.floor(Math.random() * 100000000000);
        return randomNum;
    }
    handleFileUpload() {
      const fileInput = document.getElementById('fileUploadInput');
      const file = fileInput.files[0]; // Get the selected file


      if (file) {
        if (
          file.type === 'application/vnd.ms-excel' ||
          file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ) {
          fetch('/ppc/get_csrf_token', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          })
            .then((response) => response.json())
            .then((data) => {
              const csrfToken = data.csrf_token;
              console.log('CSRF Token:', csrfToken);

              const formData = new FormData();
              formData.append('file', file);
              formData.append('csrf_token', csrfToken);

              fetch('/ppc/upload_excel_file', {
                method: 'POST',
                body: formData,
              })
                .then((response) => response.text())
                .then((result) => {

                  // Parse the JSON string back to a JavaScript object
                  const df = JSON.parse(result);
                  console.log('DataFrame:', df);

                  // Transform df to the desired format
                  const excelData = {};
                  df.forEach((obj) => {
                    for (const key in obj) {
                      let value = obj[key];
                      if (typeof value === 'number' && isNaN(value)) {
                        value = null;
                      } else if (typeof value === 'string' && value.toLowerCase() === 'none') {
                        value = null;
                      }

                      if (excelData.hasOwnProperty(key)) {
                        excelData[key].push(value);
                      } else {
                        excelData[key] = [value];
                      }
                    }
                  });
                  console.log('excelData:', excelData);
                  this.state.excelData = excelData;

                })
                .catch((error) => {
                  console.error('Error uploading file:', error);
                  // Display an error message or take appropriate action
                });
            })
            .catch((error) => {
              console.error('Error retrieving CSRF token:', error);
              // Display an error message or take appropriate action
            });
        } else {
          console.log('Invalid file type. Only Excel files are allowed.');
        }
      } else {
        console.log('No file selected');
      }
    }

    changeExcelData(event, key, nestedKey) {
      const updatedValue = event.target.value;

      // Update the state directly
      this.state.excelData[key][nestedKey] = updatedValue;

      console.log('Updated record:', updatedValue);
      // You can perform further operations with the updated value if needed
      console.log('this.state.excelData: ', this.state.excelData);
    }

    upload_data() {
      const fieldNames = Object.keys(this.state.excelData);
      const uniquePPLots = new Set(); // Set to store unique PP Lot numbers
      const existingPPLots = new Set(this.state.orderData.map(order => order.ppLot)); // Collect existing PP Lot numbers from orderData

      const promises = [];

      for (let i = 0; i < this.state.excelData[fieldNames[0]].length; i++) {
        const ppLotNum = this.state.excelData['ppLot'][i];

        // Check if the current PP Lot number is unique and not present in orderData
        if (!uniquePPLots.has(ppLotNum) && !existingPPLots.has(ppLotNum)) {
          uniquePPLots.add(ppLotNum); // Add the PP Lot number to the set

          const values = {};
          for (const fieldName of fieldNames) {
            values[fieldName] = this.state.excelData[fieldName][i];
          }

          const urgencyStatusSelector = document.getElementById(`urgencyStatusSelector-${i}`); // Get the select element for the current row

          if (urgencyStatusSelector) {
            // Set the 'urgencyStatus' field value from the select element's value attribute
            values['urgencyStatus'] = urgencyStatusSelector.value;

            // Use the ORM to create the record
            promises.push(this.orm.create('order.data', [values])); // Wrap values in an array
          } else {
            console.error(`urgencyStatusSelector-${i} not found.`);
          }
        }
      }

      // Wait for all create operations to complete
      Promise.all(promises)
        .then(() => {
          console.log('All unique records created successfully');
          // Handle success case, e.g., display a success message
        })
        .catch((error) => {
          console.error('Error creating records:', error);
          // Handle error case, e.g., display an error message
        });
    }









}
GetExcelData.template = 'ppc.GetExcelDataTemplate';
registry.category('actions').add('ppc.get_excel_data_js', GetExcelData);
