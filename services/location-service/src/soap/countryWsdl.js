const WSDL = `<?xml version="1.0" encoding="UTF-8"?>
<definitions name="CountryInfoService"
   targetNamespace="http://shiptrack.local/countryinfo"
   xmlns:tns="http://shiptrack.local/countryinfo"
   xmlns:xsd="http://www.w3.org/2001/XMLSchema"
   xmlns:soap="http://schemas.xmlsoap.org/wsdl/soap/"
   xmlns="http://schemas.xmlsoap.org/wsdl/">

  <types>
    <xsd:schema targetNamespace="http://shiptrack.local/countryinfo">
      <xsd:element name="GetCountryInfoRequest">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="countryCode" type="xsd:string"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>
      <xsd:element name="GetCountryInfoResponse">
        <xsd:complexType>
          <xsd:sequence>
            <xsd:element name="code" type="xsd:string"/>
            <xsd:element name="name" type="xsd:string"/>
            <xsd:element name="capital" type="xsd:string"/>
            <xsd:element name="currency" type="xsd:string"/>
          </xsd:sequence>
        </xsd:complexType>
      </xsd:element>
    </xsd:schema>
  </types>

  <message name="GetCountryInfoInput">
    <part name="parameters" element="tns:GetCountryInfoRequest"/>
  </message>
  <message name="GetCountryInfoOutput">
    <part name="parameters" element="tns:GetCountryInfoResponse"/>
  </message>

  <portType name="CountryInfoPortType">
    <operation name="GetCountryInfo">
      <input message="tns:GetCountryInfoInput"/>
      <output message="tns:GetCountryInfoOutput"/>
    </operation>
  </portType>

  <binding name="CountryInfoBinding" type="tns:CountryInfoPortType">
    <soap:binding style="document" transport="http://schemas.xmlsoap.org/soap/http"/>
    <operation name="GetCountryInfo">
      <soap:operation soapAction="http://shiptrack.local/countryinfo/GetCountryInfo"/>
      <input><soap:body use="literal"/></input>
      <output><soap:body use="literal"/></output>
    </operation>
  </binding>

  <service name="CountryInfoService">
    <port name="CountryInfoPort" binding="tns:CountryInfoBinding">
      <soap:address location="http://localhost:8007/wsdl/country"/>
    </port>
  </service>
</definitions>`;

module.exports = { WSDL };
