/** @odoo-module **/
import {registry, bus, services } from '@web/core/registry';
const { Component, useState, onWillStart } = owl;
import { useService } from "@web/core/utils/hooks";
import { hooks } from '@odoo/owl';
import { useModel } from '@odoo/owl';

export class OrderSelection extends Component {
    setup() {
        this.orm = useService("orm");
        this.state = useState({
            fieldNames: [], // All required fields/columns and their names as well
            fields: {},
            orderData: [],
            alignedOrderData: [], // New property to store aligned order data
            pendingApprovalOrders: [],
            selectedOrders: [], //selectedOrders property
        });
        onWillStart(async () => {
            const fields = await this.fetchModelFields();
            this.state.fields = fields;
            const excludedFields = ['message_main_attachment_id', 'create_uid', 'write_uid', 'create_date', 'write_date', 'activity_date_deadline', 'activity_exception_decoration', 'activity_exception_icon', 'activity_ids', 'activity_state', 'activity_summary', 'activity_type_icon', 'activity_type_id', 'activity_user_id', "my_activity_date_deadline", "message_is_follower", "message_follower_ids",
                "message_follower_ids", "message_partner_ids", "message_ids", "has_message", "message_needaction", "message_needaction_counter", "message_has_error", "message_has_error_counter", "message_attachment_count", "message_has_sms_error", "website_message_ids", "__last_update", "display_name", "machineRoute"];
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

            console.log('this.state.fields : ', this.state.fields);
        });
        this.state.notification =useService("notification");
        this.typingCompleted = this.typingCompleted.bind(this);
        this.approveOrder = this.approveOrder.bind(this);
    }

    alignOrderDataByClassificationType(orderData) {
        const alignedData = {};
        for (const order of orderData) {
            if (order.status === 'PPC Manager Approved') { // Filter orders by status
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

    async typingCompleted(orderId, event) {
        const updatedInput = event.target.value;
        try {
        const result = await this.orm.call('order.data', 'write', [[orderId], { remarks: updatedInput }]);
        if (result) {
            console.log('Remarks updated successfully');
        } else {
            console.error('Error occurred while updating remarks');
        }
        } catch (error) {
        }
    }

    async approveOrder(orderId) {
        const writeResult = await this.orm.write('order.data', [orderId], { status: 'Bleaching Manager Approved' });
        // Fetch the updated order data and realign the table
        const orderData = await this.fetchOrderData();
        const alignedOrderData = this.alignOrderDataByClassificationType(orderData);
        this.state.orderData = orderData;
        this.state.alignedOrderData = alignedOrderData;
        this.state.notification.add('Order Added.', {
            title: 'Success',
            type: 'success',
        });
    }

}

OrderSelection.template = 'bleaching_dept.orderSelectionTemplate';
registry.category('actions').add('bleaching_dept.order_selection_js', OrderSelection);