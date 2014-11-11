#!/usr/bin/python

def requirePOSTParameters(fieldStorage, params):
	for param in params:
		if not param in fieldStorage:
			return False
	return True

def checkDelimiterCharacter(fieldStorage, params):
	for k in fieldStorage.keys():
		if ";" in str(fieldStorage[k].value):
			return False
	return True