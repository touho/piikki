 #!/usr/bin/python
# -*- coding: utf-8 -*-

import os

requiredParameters = []

def execute(fieldStorage):
	csvfiles = [ f for f in os.listdir("logs") if ".csv" in f ]

	return {"success": True, "folder": "logs", "filenames": csvfiles}