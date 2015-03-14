#!/usr/bin/python

import os
from datetime import datetime


#Usage:
# t = new Timer("toiminto x")
# <do something...>
# t.write()



class Timer:
	def __init__(self, name):
		self.name = name
		self.startTime = datetime.now()

	def write(self):
		diff = datetime.now() - self.startTime
		with open("logs/timeDebug.txt", "a") as outf:
			s = self.name + ": " + str(diff) + "\n"
			outf.write(s);
