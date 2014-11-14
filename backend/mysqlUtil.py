#!/usr/bin/python
# -*- coding: utf-8 -*-

from backend import config

import MySQLdb

def getConnection():
	try:
		# url, user, pass, db
		con = MySQLdb.connect(config.db_host, config.db_user, config.db_pass, config.db_database)
	except:
		return None
	return con


def commitSQLCommand(sql):
	con = getConnection()
	if con:
		cur = con.cursor()
		num = cur.execute(sql)
		cur.close()
		con.commit()
		con.close()
		return num
	return 0

def fetchWithSQLCommand(sql):
	con = getConnection()
	if con:
		cur = con.cursor()
		cur.execute(sql)
		ret = cur.fetchall()
		cur.close()
		con.close()
		return ret
	return None

def dropTables():
	return commitSQLCommand("drop table users, items, piikkaukset, payments;");


def createTables():
	con = getConnection()
	if con:
		createUsersTable = """create table if not exists users (
			id int not null auto_increment, 
			name varchar(255) not null, 
			email varchar(255), 
			isAdmin boolean,
			password varchar(255),
			primary key (id) );"""
		
		createItemsTable = """create table if not exists items (
			id int not null auto_increment, 
			name varchar(255) not null, 
			price float,
			visible boolean,
			primary key (id) );"""

		createPiikkauksetTable = """create table if not exists piikkaukset (
			userId int not null, 
			itemId int not null,
			value int,
			price float,
			date datetime,
			ip varchar(127));"""

		createPaymentsTable = """create table if not exists payments (
			userId int not null, 
			value float,
			date date);"""

		cur = con.cursor()
		cur.execute(createUsersTable)
		cur.execute(createItemsTable)
		cur.execute(createPiikkauksetTable)
		cur.execute(createPaymentsTable)
		cur.close()
		con.close()

def resetPiikkauksetAndPayments():
	ret = commitSQLCommand("drop table piikkaukset, payments;");
	createTables()
	return ret

def isValidUserId(userId, con):
	cur = con.cursor()
	sql = "select * from users where id = " + str(userId) + ";";
	ret = cur.execute(sql) > 0
	cur.close()
	return ret

def isValidItemId(itemId, con):
	cur = con.cursor()
	sql = "select * from items where id = " + str(itemId) + ";";
	ret = cur.execute(sql) > 0
	cur.close()
	return ret


def getAllUsers():
	return fetchWithSQLCommand("select * from users;")

def getAllItems():
	return fetchWithSQLCommand("select * from items;")

def getAllPiikkaukset(limit=0):
	if limit == 0:
		limitStr = ";"
	else:
		limitStr = " limit " + str(limit) + ";"

	return fetchWithSQLCommand("""select piikkaukset.userId as userId, 
			piikkaukset.itemId as itemId, 
			users.name as userName, 
			items.name as itemName, 
			piikkaukset.value as value, 
			piikkaukset.price as price, 
			DATE_FORMAT(piikkaukset.date, '%Y-%m-%d %H:%i:%S') as date, 
			piikkaukset.ip as ip
			from piikkaukset left join users on piikkaukset.userId = users.id left join items on piikkaukset.itemId = items.id
			order by piikkaukset.date""" + limitStr)

def getAllPayments(limit=0):
	if limit == 0:
		limitStr = ";"
	else:
		limitStr = " limit " + str(limit) + ";"
	return fetchWithSQLCommand("""select payments.userId as userId, users.name as userName, payments.value as value, DATE_FORMAT(payments.date, '%Y-%m-%d') as date
			from payments left join users on payments.userId = users.id
			order by payments.date""" + limitStr)


