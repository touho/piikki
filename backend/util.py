#!/usr/bin/python

import os
from datetime import datetime
from passlib.hash import pbkdf2_sha256


#Usage:
# t = new Timer("toiminto x")
# <do something...>
# t.write()

def encrypt(password):
	return pbkdf2_sha256.encrypt(password, rounds=1000, salt_size=10)
def verify(password, passwordHash):
	return pbkdf2_sha256.verify(password, passwordHash)

class Timer:
	def __init__(self, name):
		self.name = name
		self.startTime = datetime.now()

	def write(self):
		diff = datetime.now() - self.startTime
		with open("logs/timeDebug.txt", "a") as outf:
			s = self.name + ": " + str(diff) + "\n"
			outf.write(s);
