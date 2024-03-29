///** @odoo-module **/
//import {registry, bus, services } from '@web/core/registry';
//const { Component, useState, onWillStart } = owl;
//import { useService } from "@web/core/utils/hooks";
//import { hooks } from '@odoo/owl';
//
//
//export class MachineStatus extends Component {
//    setup() {
//        this.state = useState({
//            machineList: [],
//            dynamicList: [],
//        });
//        this.orm = useService("orm");
//
//        onWillStart(async () => {
//            this.state.machineList = await this.orm.searchRead("machine.details", [], ["id", "subMachines", "nameOfMachines"]);
//        });
//        this.redirectToRoutingScreen = this.redirectToRoutingScreen.bind(this);
//    }
//
//    redirectToRoutingScreen() {
//        window.location.href = "/web#action=machine_module.ppc_plan_view_js";
//    }
//
//async columnCreation() {
//
//    const inputValue = document.getElementById("create_new_col").value;
//    console.log("Input value:", inputValue);
//
//    var var1 = "VAR1";
//    var var2 = "VAR2";
//    console.log("Input value: ");
//    // Call the Python function via HTTP request
//    try {
//        const response = await fetch("/machine_module/js_function", {
//            method: "POST",
//            headers: {
//                "Content-Type": "application/json"
//            },
//            body: JSON.stringify({ var1: inputValue}) // Pass
//        });
//        const result = await response.json();
//        // Handle the response from the Python function
//        console.log(result);
//    } catch (error) {
//        // Handle any errors
//        console.error("Error calling Python function:", error);
//    }
//}
//
//async dataCreation() {
//    const inputValue = document.getElementById("create_new_data").value;
//    console.log("Input value data:", inputValue);
//
//    const recordId = 1;
//    const modelName = "machine.data";
//
//    try {
//        const record = await this.orm.searchRead(modelName, [['id', '=', recordId]], ['id']);
//        if (record.length > 0) {
//            await this.orm.write(modelName, [record[0].id], { ggs : inputValue });
//            console.log("Record updated successfully!");
//        } else {
//            console.error("Record not found with ID:", recordId);
//        }
//    } catch (error) {
//        console.error("Error saving data:", error);
//    }
//}
//
////USING ORM
//    async dataRead() {
//        try {
//            const recordId = 1;
//            const modelName = "machine.data";
//            const record = await this.orm.searchRead(modelName, [['id', '=', recordId]], ['ggs']);
//            if (record.length > 0) {
//                console.log("Value of 'ggs' column:", record[0].ggs);
//            } else {
//                console.error("Record not found with ID:", recordId);
//            }
//        } catch (error) {
//            console.error("Error reading data:", error);
//        }
//    }
//}
//
//MachineStatus.template = 'machine_module.Machines';
//registry.category('actions').add('machine_module.machine_status_screen_js', MachineStatus);
//
//
//




/** @odoo-module **/
import {registry, bus, services } from '@web/core/registry';
const { Component, useState, onWillStart } = owl;
import { useService } from "@web/core/utils/hooks";
import { hooks } from '@odoo/owl';


export class MachineStatus extends Component {
    setup() {
        this.state = useState({
            machineList: [],
            dynamicList: [],
            excelData: [],
            testData: [],
            fields: [],
        });
        this.orm = useService("orm");
        onWillStart(async () => {
            this.state.machineList = await this.orm.searchRead("machine.details", [], ["id", "subMachines", "nameOfMachines", "x_danish"]);
            this.state.testData = await this.orm.searchRead("machine.data", [], ["id", "ppLotNum", "try20", "x_interface", "try42", "x_fwo"]);
            console.log("testData:", this.state.testData); // Console the testData variable
            console.log("machineList:", this.state.machineList); // Console the testData variable

        });
        this.redirectToRoutingScreen = this.redirectToRoutingScreen.bind(this);
        this.columnCreation = this.columnCreation.bind(this);
        this.ormWrite = this.ormWrite.bind(this);
    }

    redirectToRoutingScreen() {
        window.location.href = "/web#action=machine_module.ppc_plan_view_js";
    }



//async columnCreation(){
//    // Make an asynchronous request to the Python controller
//    fetch('/machine_module/js_function', {
//        method: 'POST',
//        headers: {
//            'Content-Type': 'application/json'
//        },
//        body: JSON.stringify({})
//    })
//    .then(response => response.json())
//    .then(data => {
//        this.state.fields = data['result'];
//        console.log('Received fields:', this.state.fields);
//
//    })
//    .catch(error => {
//        console.error('Error:', error);
//    });
//}


async columnCreation() {
    // Make an asynchronous request to the Python controller
    fetch('/machine_module/js_function', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
    })
    .then(response => response.json())
    .then(async data => {
        this.state.fields = data['result'];
        console.log('Received fields:', this.state.fields);



        const orderData = await this.orm.searchRead('machine.params', [], this.state.fields);
        console.log(orderData);
    })
    .catch(error => {
        console.error('Error:', error);
    });
    await this.ormWrite();
}

async ormWrite() {
    const writeResult = await this.orm.write('machine.params', [13], { x_cool_3: 'zoomzoom' });
    console.log('writeResult : ', writeResult);
}



async dataCreation() {
    const inputValue = document.getElementById("create_new_data").value;
    console.log("Input value data:", inputValue);

    const recordId = 1;
    const modelName = "machine.data";

    try {
        const record = await this.orm.searchRead(modelName, [['id', '=', recordId]], ['id']);
        if (record.length > 0) {
            await this.orm.write(modelName, [record[0].id], { ggs : inputValue });
            console.log("Record updated successfully!");
        } else {
            console.error("Record not found with ID:", recordId);
        }
    } catch (error) {
        console.error("Error saving data:", error);
    }
}


async dataRead() {
    const query = `
        SELECT ggs
        FROM machine_data
        WHERE id = 1
    `;

    try {
        const response = await fetch("/web/dataset/call_kw", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": window.csrf_token || "",
            },
            body: JSON.stringify({
                model: "machine.data",
                method: "execute_kw",
                args: ["machine.data", "execute_sql", [query], {}],
            }),
        });

        const result = await response.json();
        if (result.error) {
            console.error("Error reading data:", result.error);
        } else {
            const records = result.result;
            if (records.length > 0) {
                const ggsValue = records[0].ggs;
                console.log("ggs Value:", ggsValue);
            } else {
                console.log("No data found.");
            }
        }
    } catch (error) {
        console.error("Error calling API:", error);
    }
}

generateRandomNumber() {
    const randomNum = Math.floor(Math.random() * 100000000000);
    return randomNum;
}

}

MachineStatus.template = 'machine_module.Machines';
registry.category('actions').add('machine_module.machine_status_screen_js', MachineStatus);
