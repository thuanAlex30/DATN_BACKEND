const contractService = require('../services/contractService');
const { createResponse } = require('../utils/response');

class ContractController {
  static async getContractById(req, res) {
    try {
      const { contractId } = req.params;

      if (!contractId) {
        return res.status(400).json(createResponse(400, 'Thiếu contractId'));
      }

      const contract = await contractService.findByContractId(contractId);

      if (!contract) {
        return res.status(404).json(createResponse(404, 'Không tìm thấy hợp đồng'));
      }

      res.json(createResponse(200, 'Lấy thông tin hợp đồng thành công', contract));
    } catch (error) {
      console.error('Get contract by ID error:', error);
      res.status(500).json(createResponse(500, 'Lỗi khi lấy thông tin hợp đồng', null, error.message));
    }
  }

  static async getContractByOrderId(req, res) {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        return res.status(400).json(createResponse(400, 'Thiếu orderId'));
      }

      const contract = await contractService.findByOrderId(orderId);

      if (!contract) {
        return res.status(404).json(createResponse(404, 'Không tìm thấy hợp đồng cho đơn hàng này'));
      }

      res.json(createResponse(200, 'Lấy thông tin hợp đồng thành công', contract));
    } catch (error) {
      console.error('Get contract by order ID error:', error);
      res.status(500).json(createResponse(500, 'Lỗi khi lấy thông tin hợp đồng', null, error.message));
    }
  }

  static async getContractsByTenant(req, res) {
    try {
      const { tenantId } = req.params;
      const { page = 1, limit = 10, status } = req.query;

      if (!tenantId) {
        return res.status(400).json(createResponse(400, 'Thiếu tenantId'));
      }

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        status: status || undefined
      };

      const result = await contractService.findByTenant(tenantId, options);

      res.json(createResponse(200, 'Lấy danh sách hợp đồng thành công', result));
    } catch (error) {
      console.error('Get contracts by tenant error:', error);
      res.status(500).json(createResponse(500, 'Lỗi khi lấy danh sách hợp đồng', null, error.message));
    }
  }

  static async getLatestContract(req, res) {
    try {
      const { tenantId } = req.params;

      if (!tenantId) {
        return res.status(400).json(createResponse(400, 'Thiếu tenantId'));
      }

      const contract = await contractService.getLatestContract(tenantId);

      if (!contract) {
        return res.status(404).json(createResponse(404, 'Không tìm thấy hợp đồng'));
      }

      res.json(createResponse(200, 'Lấy hợp đồng mới nhất thành công', contract));
    } catch (error) {
      console.error('Get latest contract error:', error);
      res.status(500).json(createResponse(500, 'Lỗi khi lấy hợp đồng mới nhất', null, error.message));
    }
  }

  static async downloadContractPdf(req, res) {
    try {
      const { contractId } = req.params;

      if (!contractId) {
        return res.status(400).json(createResponse(400, 'Thiếu contractId'));
      }

      const contract = await contractService.findByContractId(contractId);

      if (!contract) {
        return res.status(404).json(createResponse(404, 'Không tìm thấy hợp đồng'));
      }

      if (!contract.pdfFileUrl) {
        return res.status(404).json(createResponse(404, 'Hợp đồng chưa có file PDF'));
      }

      res.redirect(contract.pdfFileUrl);
    } catch (error) {
      console.error('Download contract PDF error:', error);
      res.status(500).json(createResponse(500, 'Lỗi khi tải file PDF', null, error.message));
    }
  }

  static async listPdfFormFields(req, res) {
    try {
      const fieldsInfo = await contractService.listPdfFormFields();
      res.json(createResponse(200, 'Lấy danh sách form fields thành công', fieldsInfo));
    } catch (error) {
      console.error('List PDF form fields error:', error);
      res.status(500).json(createResponse(500, 'Lỗi khi lấy danh sách form fields', null, error.message));
    }
  }

  static async testTextOverlay(req, res) {
    try {
      const { baseY, textX, lineHeight, fontSize, showGrid } = req.query;
      
      const options = {};
      if (baseY !== undefined) options.baseY = baseY;
      if (textX !== undefined) options.textX = textX;
      if (lineHeight !== undefined) options.lineHeight = lineHeight;
      if (fontSize !== undefined) options.fontSize = fontSize;
      if (showGrid === 'true') options.showGrid = true;

      const result = await contractService.testTextOverlay(options);
      res.json(createResponse(200, 'Test text overlay thành công', result));
    } catch (error) {
      console.error('Test text overlay error:', error);
      res.status(500).json(createResponse(500, 'Lỗi khi test text overlay', null, error.message));
    }
  }
}

module.exports = ContractController;

