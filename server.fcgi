#!/usr/bin/env python
# -*- coding: utf-8 -*-

from backend import util

import cgi, json, os
from flup.server.fcgi import WSGIServer

DEBUG = True

if DEBUG:
	import cgitb, sys
	cgitb.enable()

from backend import action

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

def app(environ, start_response):
	#start_response('200 OK', [('Content-Type', 'text/html')])

	start_response('200 OK', [('Content-Type', 'text/html')])

	try:
		if DEBUG:
			timer = util.Timer("M")
		fieldStorage = cgi.FieldStorage()
		dump = json.dumps(action.executeAction(fieldStorage, cgi.escape(os.environ["REMOTE_ADDR"])))
		yield dump
		if DEBUG:
			writeUsedTimeToLog(fieldStorage, timer)

	except Exception as e:
		if DEBUG:
			yield "Error while executing action:", sys.exc_info()[0], str(e) #This may give too much information
		else:
			yield "Error while executing action."

if True:
	WSGIServer(app).run()
else:
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
