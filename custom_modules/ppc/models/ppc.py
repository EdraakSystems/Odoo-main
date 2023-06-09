from odoo import models, fields, api, registry, SUPERUSER_ID, sql_db, http, tools
import json

class PpcOrderView(http.Controller):
    @http.route('/api/ppc_order_view/get_model_fields', type='http', auth='user', methods=['POST'], csrf=False)
    def get_model_fields(self, **kw):
        try:
            model = http.request.env['order.data']
            fields = model.fields_get()
            return http.Response(json.dumps({'fields': fields}), content_type='application/json')
        except Exception as e:
            return http.Response(json.dumps({'error': str(e)}), content_type='application/json', status=500)

class PpcModel(models.Model):
    _name = "order.data"
    _inherit = ["mail.thread", "mail.activity.mixin"]
    _description = "Order Data"

    ppLot = fields.Integer(string='PP Lot Number')
    fabricType = fields.Selection([('flat', 'Flat'), ('lycra', 'Lycra'), ('cotton', 'Cotton'), ('silk', 'Silk')], string='Fabric Type', required=True)
    orderStatus = fields.Selection([('pending', 'Pending'), ('managerApproval', 'PPC Manager Approval')], string='Order Status')
    urgencyStatus = fields.Selection([('redAlert', 'Red Alert'), ('orderLate', 'Order Late')], string='Urgency Status')
    placement_date = fields.Date(string='Order Placement Date')
    dispatch_date = fields.Date(string='Order Dispatch Date')
    finish = fields.Char(string='Fabric Finish')
    orderNumber = fields.Integer(string='order Number')
    articleNumber = fields.Integer(string='Article Number')
    greyLotNumber = fields.Integer(string='Grey Lot Number')
    color = fields.Char(string='Color')
    construction = fields.Char(string='Construction')
    weave = fields.Char(string='Weave')
    greigeWidth = fields.Integer(string='Greige Width')
    finishedGreigeWidth = fields.Integer(string='Finished Greige Width')
    rel = fields.Integer(string='Rel')
    tol = fields.Integer(string='Tol')
    requiredQuantity = fields.Integer(string='Required Quantity')
    totalRequiredQuantity = fields.Integer(string='Total Required Quantity')
    meters = fields.Integer(string='Meters')
    supplier = fields.Char(string='Supplier')
    sourceWeft = fields.Char(string='Source Weft')
    sourceWarp = fields.Char(string='Source Warp')
    sequence = fields.Integer(string='Sequence')
    remarks = fields.Char(string='Remarks')

    # Function to save form for custom save button.
    @api.model
    def action_save(self):
        self.write({})  # Save the form data
        return {
            'type': 'ir.actions.client',
            'tag': 'reload',
        }

    def save_data(self):
        # This is for getting fabric type of the submitted form
        fabric_type = self.fabricType  # Get the selected fabricType value
        print("Selected Fabric Type: ", fabric_type)

        # This is for getting urgency Status of the submitted form
        urgency_status = self.urgencyStatus
        print("Selected Urgency Status: ", urgency_status)

        # This is for getting sequences of the same fabric Type as the submitted form
        sequences_fabric_type = self.env['order.data'].sudo().search([('fabricType', '=', fabric_type)],
                                                                     order='sequence')
        sequence_values_fabric_type = [record.sequence for record in sequences_fabric_type]
        print("Sequence Values:", sequence_values_fabric_type)

        # This is for getting the max sequence of the same fabric Type as the submitted form
        max_sequence_value_fabric_type = max(sequence_values_fabric_type) if sequence_values_fabric_type else 0
        print("Max Sequence Value (Fabric Type):", max_sequence_value_fabric_type)

        found_more_urgency = False
        red_alert_sequence_values = []

        # Check if urgency_status is 'redAlert'
        if urgency_status == 'redAlert':
            print("Found Red Alert")
            for record in sequences_fabric_type:
                if record != self and record.urgencyStatus == 'redAlert':
                    found_more_urgency = True
                    red_alert_sequence_values.append(record.sequence)

            if found_more_urgency:
                print("Found More Urgency Status")
                print("red_alert_sequence_values: ", red_alert_sequence_values)
                print("max, red_alert_sequence_values: ", max(red_alert_sequence_values))
                red_alert_final_value = max(red_alert_sequence_values)
                red_alert_final_value = red_alert_final_value + 1
                self.sequence = red_alert_final_value

                for record in sequences_fabric_type:
                    if record != self and record.urgencyStatus != 'redAlert':
                        record.sequence += 1


            else:
                print("No More Urgency Status")
                # Set the 'sequence' value to 1
                self.sequence = 1
                # Increment all the sequence values of the same fabric type by 1
                for record in sequences_fabric_type:
                    if record != self:
                        record.sequence += 1

        else:
            print("Did not Found Red Alert")
            # Get the max sequence value from the table that is of the same fabric type and set the sequence of the newly added
            sequences = self.search([], order='sequence')
            sequence_values = [record.sequence for record in sequences]
            max_sequence_value = max_sequence_value_fabric_type + 1 if sequence_values else 1
            # Update the sequence value for the current record
            self.sequence = max_sequence_value

        return {
            'type': 'ir.actions.client',
            'tag': 'reload',
        }
