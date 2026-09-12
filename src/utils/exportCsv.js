function escapeCsvValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);

  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n")
  ) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function employeesToCsv(employees) {
  const headers = [
    "Mã nhân viên",
    "Họ tên",
    "Email",
    "Số điện thoại",
    "Phòng ban",
    "Chức vụ",
    "Trạng thái"
  ];

  const rows = employees.map((employee) => [
    employee.employeeCode,
    employee.fullName,
    employee.email,
    employee.phone,
    employee.departmentId?.name || "",
    employee.positionId?.name || "",
    employee.status
  ]);

  return [headers, ...rows]
    .map((row) => row.map(escapeCsvValue).join(","))
    .join("\n");
}

module.exports = employeesToCsv;