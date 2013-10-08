package jsclassloader.cli;

public class Argument {
	
	private String name;
	private String longText;
	private String shortText;
	private String value;
	private boolean set;
	
	public Argument(String name, String shortText) {
		this.name = name;
		this.longText = "--" + name;
		this.shortText = "-" + shortText;
		this.set = false;
	}
	
	public boolean checkAndSet(String arg) {
		if (arg.length() >= longText.length() && arg.substring(0, longText.length()).equals(longText)) {
			set = true;
			if (arg.indexOf("=") > 0) {
				value = arg.substring(longText.length() + 1);
			}
			return true;
		}
		if (arg.length() >= shortText.length() && arg.substring(0, shortText.length()).equals(shortText)) {
			set = true;
			if (arg.indexOf("=") > 0) {
				value = arg.substring(shortText.length() + 1);
			}
			return true;
		}
		return false;
	}
	
	public boolean isSet() {
		return set;
	}
	
	public void setSet(boolean set) {
		this.set = set;
	}
	
	public void setValue(String value) {
		this.value = value;
	}
	
	public String getName() {
		return name;
	}
	
	public String getValue() {
		return value;
	}

	public String getShortText() {
		return shortText;
	}
	
	public String getLongText() {
		return longText;
	}

	
}