#!/usr/bin/python

import os
from datetime import datetime

def getLastCheckpointDate(dateFormat="%d.%m.%Y"):
	#if dateFormat == None:
		#dateFormat = "%d.%m.%Y"
	csvfiles = [ f for f in os.listdir("logs") if ".csv" in f ]
	if len(csvfiles) == 0:
		return None
	lastFilename = csvfiles[-1]
	dateStr = lastFilename[:19]
	date = datetime.strptime(dateStr, "%Y-%m-%d_%H-%M-%S")
	return date.strftime(dateFormat)