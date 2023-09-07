/** @odoo-module **/
import {registry, bus, services } from '@web/core/registry';
const { Component, useState, onWillStart } = owl;
import { useService } from "@web/core/utils/hooks";
import { hooks } from '@odoo/owl';
import { useModel } from '@odoo/owl';

export class FabricReq extends Component {
    setup() {
        this.orm = useService("orm");
        this.state = useState({
            orderData:[],
            issuanceData:[],
        });
        onWillStart(async () => {
            await this.getFabricIssuanceData();
        });
        this.state.notification =useService("notification");
        this.getFabricIssuanceData = this.getFabricIssuanceData.bind(this);
        this.approveRequest = this.approveRequest.bind(this);
        this.rejectRequest = this.rejectRequest.bind(this);
        this.handleSelectChange = this.handleSelectChange.bind(this);
    }

     async handleSelectChange(event) {
        const selectedValue = event.target.value;
        if(selectedValue == 'All'){
            console.log('I got selected')
            this.state.issuanceData = await this.orm.searchRead("fabric.issuance.request", [], ["orderId", "ppLot", "quantity", "status", "remarks", "requestedFabricType", "greigeLotNumber"]);
        }else{
            this.state.issuanceData = await this.orm.searchRead("fabric.issuance.request", [['status', '=', selectedValue]], ["orderId", "ppLot", "quantity", "status", "remarks", "requestedFabricType", "greigeLotNumber"]);
        }
     }

    async getFabricIssuanceData(){
        this.state.issuanceData = await this.orm.searchRead("fabric.issuance.request", [['status', '=', "Submitted"]], ["orderId", "ppLot", "quantity", "status", "remarks", "requestedFabricType", "greigeLotNumber"]);
    }

    async approveRequest(orderId) {
        try {
            const records = await this.orm.searchRead("fabric.issuance.request", [["orderId", "=", orderId]], ["id"]);
            if (records.length > 0) {
                const updatePromises = records.map(async (record) => {
                    const recordId = record.id;
                    await this.orm.write("fabric.issuance.request", [recordId], { status: 'Approved' });
                });
                await Promise.all(updatePromises);

                this.state.issuanceData = await this.orm.searchRead("fabric.issuance.request", [['status', '=', "Submitted"]], ["orderId", "ppLot", "quantity", "status", "remarks", "requestedFabricType", "greigeLotNumber"]);
            } else {
                console.log(`No matching records found for Order ID ${orderId}`);
            }
        } catch (error) {
            console.error('Error Accepting requests:', error);
        }
    }

    async rejectRequest(orderId) {
        try {
            const records = await this.orm.searchRead("fabric.issuance.request", [["orderId", "=", orderId]], ["id"]);
            if (records.length > 0) {
                const updatePromises = records.map(async (record) => {
                    const recordId = record.id;
                    await this.orm.write("fabric.issuance.request", [recordId], { status: 'Rejected' });
                });
                await Promise.all(updatePromises);

                this.state.issuanceData = await this.orm.searchRead("fabric.issuance.request", [['status', '=', "Submitted"]], ["orderId", "ppLot", "quantity", "status", "remarks", "requestedFabricType", "greigeLotNumber"]);
            } else {
                console.log(`No matching records found for Order ID ${orderId}`);
            }
        } catch (error) {
            console.error('Error rejecting requests:', error);
        }
    }

    generateRandomNumber() {
        const randomNum = Math.floor(Math.random() * 1000000000);
        return randomNum;
    }
}
FabricReq.template = 'bleaching_dept.FabricReqTemplate';
registry.category('actions').add('bleaching_dept.fabric_req_js', FabricReq);