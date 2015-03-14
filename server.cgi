#!/usr/bin/env python
# -*- coding: utf-8 -*-

import cgitb, cgi, sys, json, os, datetime
cgitb.enable()

from backend import action

DEBUG = True

def writeUsedTimeToLog(fieldStorage, startTime, endTime):
	diff = endTime - startTime
	with open("logs/timeDebug.txt", "a") as outf:
		s = ""
		if "action" in fieldStorage:
			s = fieldStorage["action"].value
			if "subAction" in fieldStorage:
				s += "." + fieldStorage["subAction"].value
		else:
			s = "?"
		s += ": " + str(diff) + "\n"
		outf.write(s);


print "Content-type:application/json;charset=utf-8"
print

try:
	if DEBUG:
		startTime = datetime.datetime.now()
	fieldStorage = cgi.FieldStorage()
	print json.dumps(action.executeAction(fieldStorage, cgi.escape(os.environ["REMOTE_ADDR"])))
	if DEBUG:
		writeUsedTimeToLog(fieldStorage, startTime, datetime.datetime.now())

except Exception as e:
	if DEBUG:
		print "Error while executing action:", sys.exc_info()[0], str(e) #This may give too much information
	else:
		print "Error while executing action:", sys.exc_info()[0]