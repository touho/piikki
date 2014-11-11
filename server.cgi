#!/usr/bin/python
# -*- coding: utf-8 -*-

import cgitb, cgi, sys, json, os
cgitb.enable()

from backend import action

print "Content-type:application/json;charset=utf-8"
print

try:
	print json.dumps(action.executeAction(cgi.FieldStorage(), cgi.escape(os.environ["REMOTE_ADDR"])))
except Exception as e:
	if "Debug" == "Debug":
		print "Error while executing action:", sys.exc_info()[0], str(e) #This may give too much information
	else:
		print "Error while executing action:", sys.exc_info()[0]