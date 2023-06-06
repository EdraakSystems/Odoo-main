print("I RAN")

import psycopg2
from odoo import models, fields, api, registry, SUPERUSER_ID, sql_db

@api.model
def update_schema():
    print("update_schema RAN")

update_schema()


def generate_code_line(parameter_name, parameter_type, string_value):
    code_line = f"{parameter_name} = fields.{parameter_type}(string='{string_value}')"
    return code_line

line = generate_code_line("parameter1", "Char", "parameter1")
print(line)