 #!/usr/bin/python
# -*- coding: utf-8 -*-

from .. import mysqlUtil

requiredParameters = []

def execute(fieldStorage):
	ret = mysqlUtil.getAllPayments(200)
	if not ret == None:
		return {"success": True, "payments": ret}
	else:
		return {"success": False}