-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "TaxData_tahun_dusun_idx" ON "TaxData"("tahun", "dusun");

-- CreateIndex
CREATE INDEX "TaxData_tahun_paymentStatus_idx" ON "TaxData"("tahun", "paymentStatus");
