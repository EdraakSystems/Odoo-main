/** @odoo-module **/
import {registry, bus, services } from '@web/core/registry';
const { Component, useState, onWillStart } = owl;
import { useService } from "@web/core/utils/hooks";
import { hooks } from '@odoo/owl';
import { useModel } from '@odoo/owl';

export class ParamsSelector extends Component {
    setup() {
        this.orm = useService("orm");
        this.state = useState({
            machines:[],
            machineRouting:[],
            machineStatus:[],
            fields:[],
            fieldNames:[],
            machineType:[],
            machineParams:[],
        });
        onWillStart(async () => {
            await this.getData();
            this.state.fieldNames = await this.fetchModelFields();
            // Unwanted fields
            const excludedFields = ['activity_date_deadline', 'activity_exception_icon', 'activity_exception_decoration', 'activity_ids', 'activity_state', 'activity_summary', 'activity_type_icon', 'activity_type_id', 'activity_user_id', 'activity_state', 'activity_summary', 'activity_type_icon', 'activity_type_id', 'activity_user_id', "create_date", "create_uid", "display_name",
                                    "has_message", "id","message_ids","message_attachment_count","message_follower_ids","message_has_error","message_has_error_counter", "message_has_sms_error", "website_message_ids", "__last_update", "display_name", "machineRoute", "write_uid", "write_date", "orderId", "message_is_follower", "message_partner_ids", "message_needaction", "message_needaction_counter", "message_main_attachment_id", "my_activity_date_deadline", "machineId"];
            const filteredFields = Object.keys(this.state.fieldNames)
                .filter(fieldName => !excludedFields.includes(fieldName))
                .map(fieldName => ({
                    name: fieldName,
                    actualName: this.state.fieldNames[fieldName].string,
                }));
            this.state.fields = filteredFields;


            console.log("fields: ", this.state.fields);
            console.log('this.state.machines : ', this.state.machines);
            console.log('this.state.machineRouting : ', this.state.machineRouting);
            console.log('this.state.machineStatus : ', this.state.machineStatus);
            console.log('this.state.fieldNames : ', this.state.fieldNames);
            console.log('this.state.machineType : ', this.state.machineType);
        });
        this.state.notification =useService("notification");
        this.getData = this.getData.bind(this);
        this.organizeMachinesByType = this.organizeMachinesByType.bind(this);
        this.macSelector = this.macSelector.bind(this);
    }

    async getData(){
        this.state.machines = await this.orm.searchRead("bleaching.machines", [], ["id", "machine_name", "machine_type", "underMaintenance"]);
        this.state.machineRouting = await this.orm.searchRead("machine.routing", [], ["id", "orderId", "machineId", "status"]);
        this.state.machineType = await this.orm.searchRead("bleaching_machine.types", [], ["id", "machine_type_name", "machineParams"]);

        const machinesByType = this.organizeMachinesByType();
        this.state.machineStatus = machinesByType;
    }

    organizeMachinesByType() {
        const machinesByType = {};
        this.state.machines.forEach(machine => {
            const machineType = machine.machine_type[1]; // Get the machine_type name from the array (2nd index)
            const machineTypeId = machine.machine_type[0]; // Get the machine_type_id from the array (1st index)
            const machineId = machine.id;
            const machineName = machine.machine_name;
            const machineMaintenance = machine.underMaintenance;
            if (!machinesByType[machineType]) {
                machinesByType[machineType] = [{
                    machine_type_id: machineTypeId,
                    machine_type_name: machineType,
                    machine_id: machineId,
                    machine_name: machineName,
                    machine_under_maintenance: machineMaintenance,
                }];
            } else {
                machinesByType[machineType].push({
                    machine_type_id: machineTypeId,
                    machine_type_name: machineType,
                    machine_id: machineId,
                    machine_name: machineName,
                    machine_under_maintenance: machineMaintenance,
                });
            }
        });
        // Convert machinesByType from object to array
        const machinesArray = Object.values(machinesByType);
        return machinesArray;
    }

    generateRandomNumber() {
        const randomNum = Math.floor(Math.random() * 10000000);
        return randomNum;
    }

    async macSelector(event) {
        const selectedValue = parseInt(event.target.value);
        console.log('selectedValue : ', selectedValue);

        const selectedMachineType = this.state.machineType.find(machineType => machineType.id === selectedValue);

        if (selectedMachineType) {
            console.log('selectedMachineType : ', selectedMachineType.machineParams);
            if (selectedMachineType.machineParams) {
                const machineParams = selectedMachineType.machineParams.split(',').map(param => param.trim());
                this.state.machineParams = machineParams.map(param => {
                    const field = this.state.fields.find(field => field.name === param);
                    return field ? field.actualName : param;
                });
                this.state.machineSelected = true;
            } else {
                console.log('selectedMachineType.machineParams is empty');
                this.state.machineParams = [];
            }
            console.log('this.state.machineParams : ', this.state.machineParams);
            this.state.selectedMachineTypeId = selectedValue; // Set the selected machine type
        } else {
            console.log('Machine type not found');
            this.state.machineSelected = false;
        }
    }

    async fetchModelFields() {
        const response = await fetch('/api/params_fields/get_model_fields', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        const result = await response.json();
        return result.fields;
    }

    addParam(event) {
        const selectedMachineTypeId = parseInt($('select.machine_selector').val());
        const selectedParamName = $('select.param_selector').val();
        const selectedMachineType = this.state.machineType.find(machineType => machineType.id === selectedMachineTypeId);

        if (selectedMachineType) {
            let machineParamsArray = selectedMachineType.machineParams.split(',').map(param => param.trim());
            console.log('Machine Params Array:', machineParamsArray);

            if (!machineParamsArray.includes(selectedParamName)) {
                machineParamsArray.push(selectedParamName);
                const updatedMachineParams = machineParamsArray.join(',');
                console.log('Updated Machine Params:', updatedMachineParams);
                // Update machineParams in the database
                this.orm
                    .call('bleaching_machine.types', 'write', [[selectedMachineTypeId], { machineParams: updatedMachineParams }])
                    .then(result => {
                        if (result) {
                            console.log('Machine params updated in the database');
                        } else {
                            console.error('Error updating machine params in the database');
                        }
                    })
                    .catch(error => {
                        console.error('Error occurred while updating machine params:', error);
                    });
            } else {
                console.log(`${selectedParamName} already exists in machineParamsArray`);
            }
        } else {
            console.log('Machine type not found');
        }
    }

    removeParam(event) {
        const selectedMachineTypeId = parseInt($('select.machine_selector').val());
        const selectedParamName = $('select.param_selector').val();
        const selectedMachineType = this.state.machineType.find(machineType => machineType.id === selectedMachineTypeId);

        if (selectedMachineType) {
            let machineParamsArray = selectedMachineType.machineParams.split(',').map(param => param.trim());
            console.log('Machine Params Array:', machineParamsArray);

            if (machineParamsArray.includes(selectedParamName)) {
                machineParamsArray = machineParamsArray.filter(param => param !== selectedParamName);
                const updatedMachineParams = machineParamsArray.join(',');
                console.log('Updated Machine Params:', updatedMachineParams);

                // Update machineParams in the database
                this.orm
                    .call('bleaching_machine.types', 'write', [[selectedMachineTypeId], { machineParams: updatedMachineParams }])
                    .then(result => {
                        if (result) {
                            console.log('Machine params updated in the database');
                        } else {
                            console.error('Error updating machine params in the database');
                        }
                    })
                    .catch(error => {
                        console.error('Error occurred while updating machine params:', error);
                    });
            } else {
                console.log(`${selectedParamName} does not exist in machineParamsArray`);
            }
        } else {
            console.log('Machine type not found');
        }
    }



}
ParamsSelector.template = 'bleaching_dept.ParamsSelectorTemplate';
registry.category('actions').add('bleaching_dept.params_selector_js', ParamsSelector);
