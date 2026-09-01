const WSDL = `<?xml version="1.0" encoding="UTF-8"?>
<definitions name="CurrencyConversionService"
   targetNamespace="http://shiptrack.local/currency"
   xmlns:tns="http://shiptrack.local/currency"
   xmlns:xsd="http://www.w3.org/2001/XMLSchema"
   xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
   xmlns="http://schemas.xmlsoap.org/wsdl/">

  <types>
    <xsd:schema targetNamespace="http://shiptrack.local/currency">
      <xsd:element name="ConvertCurrencyRequest">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="amount" type="xsd:double"/>
            <xsd:element name="fromCurrency" type="xsd:string"/>
            <xsd:element name="toCurrency" type="xsd:string"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>
      <xsd:element name="ConvertCurrencyResponse">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="convertedAmount" type="xsd:double"/>
            <xsd:element name="fromCurrency" type="xsd:string"/>
            <xsd:element name="toCurrency" type="xsd:string"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>
    </xsd:schema>
  </types>

  <message name="ConvertCurrencyInput">
    <part name="parameters" element="tns:ConvertCurrencyRequest"/>
  </message>
  <message name="ConvertCurrencyOutput">
    <part name="parameters" element="tns:ConvertCurrencyResponse"/>
  </message>

  <portType name="CurrencyConversionPortType">
    <operation name="ConvertCurrency">
      <input message="tns:ConvertCurrencyInput"/>
      <output message="tns:ConvertCurrencyOutput"/>
    </operation>
  </portType>

  <binding name="CurrencyConversionBinding" type="tns:CurrencyConversionPortType">
    <soap:binding style="document" transport="http://schemas.xmlsoap.org/soap/http"/>
    <operation name="ConvertCurrency">
      <soap:operation soapAction="http://shiptrack.local/currency/ConvertCurrency"/>
      <input><soap:body use="literal"/></input>
      <output><soap:body use="literal"/></output>
    </operation>
  </binding>

  <service name="CurrencyConversionService">
    <port name="CurrencyConversionPort" binding="tns:CurrencyConversionBinding">
      <soap:address location="http://localhost:8006/wsdl/currency"/>
    </port>
  </service>
</definitions>`;

module.exports = { WSDL };
