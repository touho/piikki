#!/usr/bin/python

from datetime import datetime
from passlib.hash import pbkdf2_sha256
import config
import smtplib


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

def sendEmail(address, username, subject, message):
	if not address or "@" not in address or "." not in address:
		return False
	server = smtplib.SMTP('smtp.gmail.com:587')
	server.starttls()
	msg = "From: Piikki Mestari\n"
	msg += "To: " + username + " <" + address + ">\n"
	msg += "Subject: " + subject + "\n\n"
	msg += message
	server.login(config.mail_username, config.mail_password)
	server.sendmail(config.mail_address, address, msg)
	server.quit()

	return True