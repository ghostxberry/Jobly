"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

class Job {

  static async create({ title, salary, equity, companyHandle }) {
    const duplicateCheck = await db.query(
      `SELECT id
       FROM jobs
       WHERE title = $1`,
      [title]
    );

    if (duplicateCheck.rows[0]) {
      throw new BadRequestError(`Duplicate job: ${title}`);
    }

    const result = await db.query(
      `INSERT INTO jobs
        (title, salary, equity, company_handle)
        VALUES ($1, $2, $3, $4)
        RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
      [title, salary, equity, companyHandle]
    );
    const job = result.rows[0];

    return job;
  }

  static async findAll() {
    const jobsRes = await db.query(
      `SELECT id,
              title,
              salary,
              equity,
              company_handle AS "companyHandle"
       FROM jobs
       ORDER BY title`
    );
    return jobsRes.rows;
  }

  static async get(id) {
    const jobRes = await db.query(
      `SELECT id,
              title,
              salary,
              equity,
              company_handle AS "companyHandle"
       FROM jobs
       WHERE id = $1`,
      [id]
    );
  
    const job = jobRes.rows[0];
  
    if (!job) {
      throw new NotFoundError(`No job: ${id}`);
    }
  
    const companyRes = await db.query(
      `SELECT handle,
              name,
              description,
              num_employees AS "numEmployees",
              logo_url AS "logoUrl"
       FROM companies
       WHERE handle = $1`,
      [job.companyHandle]
    );
  
    const company = companyRes.rows[0];
  
    if (!company) {
      throw new NotFoundError(`No company: ${job.companyHandle}`);
    }
  
    return {
      id,
      title: job.title,
      salary: job.salary,
      equity: job.equity,
      company
    };
  }

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(data, {
      title: "title",
      equity: "equity",
      salary: "salary",
    });
    values.push(id);

    const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = $${values.length} 
                      RETURNING id, title, salary, equity, company_handle AS "companyHandle"`;
    const result = await db.query(querySql, values);
    const job = result.rows[0];

    if (!job) {
      throw new NotFoundError(`No job: ${id}`);
    }

    return job;
  }

  static async remove(id) {
    const result = await db.query(
      `DELETE FROM jobs
       WHERE id = $1
       RETURNING title`,
      [id]
    );
    const job = result.rows[0];

    if (!job) {
      throw new NotFoundError(`No job: ${id}`);
    }
    return job;
  }
  static async filter(filters = {}) {
    let query = `SELECT j.id,
                        j.title,
                        j.salary,
                        j.equity,
                        j.company_handle AS "companyHandle",
                        c.name AS "companyName"
                 FROM jobs j
                 LEFT JOIN companies c ON j.company_handle = c.handle`;
    let whereExpressions = [];
    let queryValues = [];
  
    const { title, minSalary, hasEquity } = filters;
  
    if (title) {
      queryValues.push(`%${title}%`);
      whereExpressions.push(`j.title ILIKE $${queryValues.length}`);
    }
  
    if (minSalary !== undefined) {
      queryValues.push(minSalary);
      whereExpressions.push(`j.salary >= $${queryValues.length}`);
    }
  
    if (hasEquity === true) {
      whereExpressions.push(`j.equity > 0`);
    }
  
    if (whereExpressions.length > 0) {
      query += ' WHERE ' + whereExpressions.join(' AND ');
    }
  
    const result = await db.query(query, queryValues);
  
    return result.rows.map(row => ({
      id: row.id,
      title: row.title,
      salary: row.salary,
      equity: row.equity,
      companyHandle: row.companyHandle,
      companyName: row.companyName
    }));
  }
  
  
}

module.exports = Job;
