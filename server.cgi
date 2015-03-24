#!/usr/bin/env python
# -*- coding: utf-8 -*-

import cgi, json, os

DEBUG = False

if DEBUG:
	import cgitb, sys
	cgitb.enable()

from backend import action
from backend import util


def writeUsedTimeToLog(fieldStorage, timer):
	s = ""
	if "action" in fieldStorage:
		s = fieldStorage["action"].value
		if "subAction" in fieldStorage:
			s += "." + fieldStorage["subAction"].value
	else:
		s = "?"
	timer.name = s
	timer.write()



print "Content-type:application/json;charset=utf-8"
print

try:
	if DEBUG:
		timer = util.Timer("")
	fieldStorage = cgi.FieldStorage()
	print json.dumps(action.executeAction(fieldStorage, cgi.escape(os.environ["REMOTE_ADDR"])))
	if DEBUG:
		writeUsedTimeToLog(fieldStorage, timer)

except Exception as e:
	if DEBUG:
		print "Error while executing action:", sys.exc_info()[0], str(e) #This may give too much information
	else:
		print "Error while executing action."